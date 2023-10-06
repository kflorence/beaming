import { CompoundPath, Group, Path, Point } from 'paper'
import { Item } from '../item'
import { emitEvent, getOppositeDirection } from '../util'

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

    const tile = event.detail.modifier.tile
    const stepIndex = this.#steps.findIndex((step) => step.tile === tile)

    this.#updateState(stepIndex)
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
    console.log(step, tile)
    // The next step would be off the grid
    if (!tile) {
      console.log('beam is going off the grid')
      this.#onCollision()
      return
    }

    // Entering a new tile
    if (step.tile !== tile) {
      console.log('entering a new tile')
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
    for (const collision of Beam.#getCollisions(tile, [step.point, nextStep.point])) {
      const item = collision.item

      console.log('collision', collision)

      // By default, the beam will stop at the first collision point
      result = new Beam.#Result(nextStep.withPoint(collision.intersections[0].point), { collision })

      if (this.debug) {
        collision.intersections.forEach((curveLocation) => {
          const circle = new Path.Circle({ radius: 3, fillColor: 'black', center: curveLocation.point })
          layout.layers.debug.addChild(circle)
        })
      }

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

    this.#path.add(result.step.point)
    this.#steps.push(result.step)

    if (this.debug) {
      const circle = new Path.Circle({ radius: 3, fillColor: 'red', center: result.step.point })
      layout.layers.debug.addChild(circle)
    }

    this.#state = result.state
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
    console.log('terminus collision')
    // Otherwise, treat this as a collision
    return result
  }

  #startDirection () {
    // Take rotation of the parent (terminus) into account
    return (this.#opening.direction + this.parent.rotateDirection) % 6
  }

  #updateState (stepIndex) {
    if (stepIndex < 0) {
      return
    }

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
      // FIXME this is not working
      deletedSteps.forEach((step) => step.tile.removeItem(this))
    }

    this.done = false
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
