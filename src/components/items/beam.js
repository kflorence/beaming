import { CompoundPath, Group, Path, Point } from 'paper'
import { Item } from '../item'
import { emitEvent, getOppositeDirection } from '../util'
import { Modifier } from '../modifier'

export class Beam extends Item {
  debug = false
  done = false
  type = Item.Types.beam

  #collisionHandlers = {}
  #opening
  #path
  #state = {
    collision: undefined,
    connection: undefined
  }

  #steps = []

  constructor (terminus, opening) {
    super(...arguments)

    this.#opening = opening

    this.color = opening.color
    this.direction = opening.direction
    this.width = terminus.radius / 10

    this.#path = new Path({
      closed: false,
      strokeColor: this.color,
      strokeJoin: 'round',
      strokeWidth: this.width
    })

    this.group = new Group({
      children: [this.#path],
      locked: true
    })

    this.#collisionHandlers[Item.Types.beam] = this.#onBeamCollision.bind(this)
    this.#collisionHandlers[Item.Types.terminus] = this.#onTerminusCollision.bind(this)
  }

  isActive () {
    return this.#opening.on && !this.done
  }

  onEvent (event) {
    if (!this.#opening.on) {
      return
    }

    const detail = event.detail
    const modifier = detail.modifier
    const stepIndex = this.#steps.findLastIndex((step) => step.tile === modifier.tile)

    if (stepIndex > 0) {
      // The beam occupies the modified tile
      this.#updateState(stepIndex)
      return
    }

    const items = detail.items
    const terminus = items.find((item) => item.type === Item.Types.terminus)
    if (modifier.type === Modifier.Types.toggle && terminus && terminus !== this.parent) {
      // A terminus was toggled, which means this beam may be able to update
      this.#updateState()
    }
  }

  /**
   * On each step, a beam will move towards the edge of the current tile until it either reaches that point, or it
   * intersects with something else. A beam will be considered 'done' when it either collides with something or it
   * reaches a terminus opening.
   */
  step (puzzle) {
    if (!this.isActive()) {
      return
    }

    const layout = puzzle.layout
    const step = this.#steps[this.#steps.length - 1] || this.#firstStep()
    const direction = step.direction
    const tile = step.segmentIndex % 2 === 0
      ? step.tile
      : layout.getNeighboringTile(step.tile.coordinates.axial, direction)

    console.log('stepping', this.color, step, tile)

    // The next step would be off the grid
    if (!tile) {
      console.log('beam is going off the grid')
      this.#onCollision()
      return
    }

    // Add beam to tile
    if (!tile.items.some((item) => item === this)) {
      // Add this beam to the tile item list so other beams can see it
      tile.addItem(this)
    }

    const nextStep = new Beam.#Step(
      tile,
      direction,
      Beam.#getNextPoint(step.point, tile.parameters.inradius, direction),
      this.#path.segments.length
    )

    let result
    const collisions = Beam.#getCollisions(tile, [step.point, nextStep.point])
    for (const collision of collisions) {
      const item = collision.item

      console.log('collision', this.color, collision)

      // By default, the beam will stop at the first collision point
      result = new Beam.#Result(nextStep.withPoint(collision.intersections[0].point), { collision })

      // Let individual item handlers decide on a different result
      const handler = this.#collisionHandlers[item.type]
      if (handler) {
        result = handler(item, collision, step, nextStep, result)
      }

      if (result instanceof Beam.#Result) {
        break
      }
    }

    if (!result) {
      result = new Beam.#Result(nextStep)
    }

    if (this.debug) {
      const circle = new Path.Circle({
        radius: 3,
        fillColor: this.color,
        strokeColor: 'black',
        strokeWidth: 1,
        center: result.step.point
      })
      layout.layers.debug.addChild(circle)
    }

    this.#path.add(result.step.point)
    this.#steps.push(result.step)

    this.#state = result.state

    console.log('step result', this.color, result)

    if (this.#state.collision) {
      this.#onCollision()
    } else if (this.#state.connection) {
      this.#onConnection()
    }
  }

  update () {
    // Handle 'off'. 'On' will be handled upstream in puzzle.
    if (!this.#opening.on) {
      this.#updateState(0)
    }
  }

  #firstStep () {
    const tile = this.parent.parent
    const point = tile.center
    const step = new Beam.#Step(tile, this.#startDirection(), point, 0)

    this.#path.add(point)
    this.#steps.push(step)

    tile.addItem(this)

    return step
  }

  #onBeamCollision (beam, collision, step, nextStep, result) {
    // Ignore own beam
    return beam === this ? undefined : result
  }

  #onCollision () {
    const collision = this.#state.collision
    this.done = true
    emitEvent(Beam.Events.Collision, { beam: this, collision })
  }

  #onConnection () {
    const connection = this.#state.connection
    this.done = true
    connection.terminus.onConnection(connection.opening.direction)
    emitEvent(Beam.Events.Connection, { beam: this, connection })
  }

  #onTerminusCollision (terminus, collision, step, nextStep, result) {
    // Colliding with the starting terminus on the first step, ignore
    if (terminus === this.parent && step.segmentIndex === 0) {
      return
    }

    const opening = terminus.openings[getOppositeDirection(step.direction)]

    // Beam has connected to a valid opening
    if (!opening.on && opening.color === this.color) {
      const connection = { terminus, opening }
      return new Beam.#Result(nextStep, { connection })
    }

    // Otherwise, treat this as a collision
    return result
  }

  #startDirection () {
    // Take rotation of the parent (terminus) into account
    return (this.#opening.direction + this.parent.rotateDirection) % 6
  }

  #updateState (stepIndex) {
    console.log('updateState', this.color, stepIndex)
    this.done = false

    const connection = this.#state.connection
    if (connection) {
      connection.terminus.onDisconnection(connection.opening.direction)
      this.#state.connection = undefined
    }

    this.#state.collision = undefined

    const step = this.#steps[stepIndex]
    if (step) {
      this.#path.removeSegments(step.segmentIndex)
      const deletedSteps = this.#steps.splice(stepIndex)

      // Get the unique set of tiles
      const tiles = [...new Set(deletedSteps.map((step) => step.tile))]
      tiles.forEach((tile) => tile.removeItem(this))
    }
  }

  static #getCollisions (tile, segments) {
    const path = new Path({ segments })
    return tile.items
      .map((item) => {
        const compoundPath = new CompoundPath({ children: item.group.clone().children })
        const intersections = path.getIntersections(compoundPath)
        return { item, intersections }
      })
      .filter((result) => result.intersections.length)
  }

  static #getNextPoint (point, length, direction) {
    const vector = new Point(0, 0)
    vector.length = length
    // In PaperJS an angle of zero corresponds with the right hand side of the horizontal axis of a circle. The
    // direction we are given correspond with the segments of a hexagon, which start at an angle of 240 degrees.
    vector.angle = 240 + (60 * direction)
    return point.add(vector)
  }

  static #Result = class {
    constructor (step, state = {}) {
      this.step = step
      this.state = state
    }

    withState (state) {
      return new Beam.#Result(this.step, state)
    }
  }

  static #Step = class {
    constructor (tile, direction, point, segmentIndex) {
      this.direction = direction
      this.point = point
      this.segmentIndex = segmentIndex
      this.tile = tile
    }

    withPoint (point) {
      return new Beam.#Step(this.tile, this.direction, point, this.segmentIndex)
    }
  }

  static Events = Object.freeze({
    Collision: 'beam-collision',
    Connection: 'beam-connection'
  })
}
