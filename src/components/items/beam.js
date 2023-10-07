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

  #stepIndex = 0
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
      this.#stepIndex = stepIndex
      return
    }

    const items = detail.items
    const terminus = items.find((item) => item.type === Item.Types.terminus)
    if (modifier.type === Modifier.Types.toggle && terminus && terminus !== this.parent) {
      // A terminus was toggled, which means this beam may be able to update
      this.done = false
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
    const currentStep = this.#steps.length === 0 ? this.#firstStep() : this.#steps[this.#stepIndex]
    const direction = currentStep.direction
    const tile = currentStep.segmentIndex % 2 === 0
      ? currentStep.tile
      : layout.getNeighboringTile(currentStep.tile.coordinates.axial, direction)

    console.log('step: ' + this.#stepIndex, this.color, currentStep, tile)

    // The next step would be off the grid
    if (!tile) {
      console.log('beam is going off the grid', this.color)
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
      Beam.#getNextPoint(currentStep.point, tile.parameters.inradius, direction),
      currentStep.segmentIndex + 1
    )

    let resolvedStep
    const collisions = Beam.#getCollisions(tile, [currentStep.point, nextStep.point])
    for (const collision of collisions) {
      console.log('collision', this.color, collision)

      // By default, the beam will stop at the first collision point
      resolvedStep = Beam.#Step.from(nextStep, { point: collision.intersections[0].point, state: { collision }})

      const handler = this.#collisionHandlers[collision.item.type]
      if (handler) {
        resolvedStep = handler(collision, currentStep, nextStep, resolvedStep)
      }

      if (resolvedStep instanceof Beam.#Step) {
        break
      }
    }

    if (!resolvedStep) {
      resolvedStep = nextStep
    }

    if (this.debug) {
      const circle = new Path.Circle({
        radius: 3,
        fillColor: this.color,
        strokeColor: 'black',
        strokeWidth: 1,
        center: resolvedStep.point
      })
      layout.layers.debug.addChild(circle)
    }

    const existingNextStep = this.#steps[this.#stepIndex + 1]
    if (existingNextStep) {
      if (existingNextStep === resolvedStep) {
        // Nothing to do
        return
      } else {
        // We are revising history.
        this.#updateState(this.#stepIndex)
      }
    }

    this.#path.add(resolvedStep.point)
    this.#steps.push(resolvedStep)
    this.#stepIndex++

    console.log('added step', this.color, resolvedStep)

    if (resolvedStep.state.collision) {
      this.#onCollision(resolvedStep)
    } else if (resolvedStep.state.connection) {
      this.#onConnection(resolvedStep)
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

  #onBeamCollision (collision, currentStep, nextStep, resolvedStep) {
    // Ignore own beam
    return collision.item === this ? undefined : resolvedStep
  }

  #onCollision (resolvedStep) {
    const collision = resolvedStep.state.collision
    this.done = true
    emitEvent(Beam.Events.Collision, { beam: this, collision })
  }

  #onConnection (resolvedStep) {
    const connection = resolvedStep.state.collision
    this.done = true
    connection.terminus.onConnection(connection.opening.direction)
    emitEvent(Beam.Events.Connection, { beam: this, connection })
  }

  #onTerminusCollision (collision, currentStep, nextStep, resolvedStep) {
    const terminus = collision.item

    // Colliding with the starting terminus on the first step, ignore
    if (terminus === this.parent && currentStep.segmentIndex === 0) {
      return
    }

    const opening = terminus.openings[getOppositeDirection(currentStep.direction)]

    // Beam has connected to a valid opening
    if (!opening.on && opening.color === this.color) {
      const connection = { terminus, opening }
      return Beam.#Step.from(nextStep, { connection })
    }

    // Otherwise, treat this as a collision
    return resolvedStep
  }

  #startDirection () {
    // Take rotation of the parent (terminus) into account
    return (this.#opening.direction + this.parent.rotateDirection) % 6
  }

  #updateState (stepIndex) {
    const oldLastStep = this.#steps[this.#stepIndex]
    const newLastStep = this.#steps[stepIndex]

    console.log('updateState', this.color, 'current stepIndex: ' + this.#stepIndex, 'new stepIndex: ' + stepIndex)

    if (this.#stepIndex !== stepIndex && newLastStep) {
      this.#path.removeSegments(newLastStep.segmentIndex)
      const deletedSteps = this.#steps.splice(stepIndex)

      // Remove beam from tiles it is being removed from
      const tiles = [...new Set(deletedSteps.map((step) => step.tile))]
      tiles.forEach((tile) => tile.removeItem(this))

      if (oldLastStep) {
        const connection = oldLastStep.state.connection
        if (connection) {
          connection.terminus.onDisconnection(connection.opening.direction)
        }
      }

      this.#stepIndex = stepIndex
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

  static #Step = class {
    constructor (tile, direction, point, segmentIndex, state = {}) {
      this.direction = direction
      this.point = point
      this.segmentIndex = segmentIndex
      this.tile = tile
      this.state = state
    }

    update (options) {
      Object.entries(options).forEach(([key, value]) => {
        if (Object.hasOwn(this, key)) {
          this[key] = value
        }
      })
      return this
    }

    static from (step, options) {
      return new Beam.#Step(step.tile, step.direction, step.point, step.segmentIndex, step.state).update(options)
    }
  }

  static Events = Object.freeze({
    Collision: 'beam-collision',
    Connection: 'beam-connection'
  })
}
