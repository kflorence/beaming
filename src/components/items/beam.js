import { CompoundPath, Group, Path, Point } from 'paper'
import { Item } from '../item'
import { deepEqual, emitEvent, getConvertedDirection } from '../util'

export class Beam extends Item {
  done = false
  type = Item.Types.beam

  #opening
  #path

  #stepIndex = -1
  #steps = []

  constructor (terminus, opening) {
    super(...arguments)

    this.#opening = opening

    this.color = opening.color
    this.direction = opening.direction
    this.width = terminus.radius / 10

    // TODO color should be applied per segment
    // This will probably mean storing a bunch of paths instead of a single path
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
  }

  isActive () {
    return this.#opening.on && !this.#opening.connected && !this.done
  }

  getConnection () {
    return this.getLastStep()?.state.connection
  }

  getLastStep () {
    return this.#steps[this.#steps.length - 1]
  }

  onCollision (beam, collision, currentStep, nextStep, collisionStep) {
    const lastStepIndex = this.#steps.length - 1
    if (beam === this && collision.item === this && this.#stepIndex < lastStepIndex) {
      console.debug(
        this.color,
        'ignoring collision with self while re-evaluating history',
        'current index: ' + this.#stepIndex,
        'last index: ' + lastStepIndex
      )
      return
    }

    // We have collided with another beam, stop
    if (this.isActive()) {
      const lastStep = this.getLastStep()
      lastStep.state = { collision: { point: collision.point, item: beam } }

      this.#onUpdate(lastStep)
    }

    return collisionStep
  }

  onModifierInvoked (event) {
    if (!this.#opening.on) {
      // If the beam is off but has steps, we should get rid of them (toggled off).
      if (this.#steps.length) {
        this.#updateHistory(0)
      }
      return
    }

    // We want the first step that contains the tile the event occurred on
    const stepIndex = this.#steps.findIndex((step) => step.tile === event.detail.tile)
    if (stepIndex >= 0) {
      // Mark as not done to trigger the processing of another step
      this.done = false
      // Begin re-evaluating at the step prior to this
      this.#stepIndex = Math.max(stepIndex - 1, 0)
      return
    }

    const collisionItem = this.getLastStep()?.state.collision?.item
    if (collisionItem?.type === Item.Types.beam && !collisionItem.isActive()) {
      // Re-evaluate since the beam we collided with has been turned off
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

    // First step
    if (this.#steps.length === 0) {
      const tile = this.parent.parent
      this.#addStep(new Beam.Step(tile, this.color, this.#startDirection(), tile.center, 0))
    }

    const layout = puzzle.layout
    const currentStep = this.#steps[this.#stepIndex]

    // On the first step, we have to take the rotation of the terminus into account
    const direction = this.#stepIndex === 0 ? this.#startDirection() : currentStep.direction

    // Each step is equal to the width of half a tile, so every two steps we will be entering a new tile
    const isNewTile = currentStep.segmentIndex % 2 === 0

    const tile = isNewTile
      ? currentStep.tile
      : layout.getNeighboringTile(currentStep.tile.coordinates.axial, direction)

    console.debug(this.color, 'step', this.#stepIndex, currentStep)

    // The next step would be off the grid
    if (!tile) {
      console.debug(this.color, 'stopping due to out of bounds')
      currentStep.state = { collision: { outOfBounds: true } }
      this.#onUpdate(currentStep)
      return
    }

    let nextStep = new Beam.Step(
      tile,
      this.color,
      direction,
      Beam.getNextPoint(currentStep.point, tile.parameters.inradius, direction),
      currentStep.segmentIndex + 1
    )

    // See if there are any collisions along the path we plan to take
    const collisions = Beam.#getCollisions(tile, [currentStep.point, nextStep.point], puzzle)

    let collisionStep
    for (const collision of collisions) {
      console.debug(this.color, 'resolving step collision:', collision)

      const item = collision.item
      const point = collision.intersections[0].point
      const state = {
        collision: {
          item,
          point: { x: point.x, y: point.y }
        }
      }

      // By default, the next step will be treated as a collision with the beam stopping at the first point of
      // intersection with the item.
      collisionStep = Beam.Step.from(nextStep, { point, state })

      // Allow the item to change the resulting step
      collisionStep = collision.item.onCollision(this, collision, currentStep, nextStep, collisionStep)

      // An item can elect to continue processing further collisions by returning a non-step result
      if (collisionStep instanceof Beam.Step) {
        break
      }
    }

    if (collisionStep) {
      nextStep = collisionStep
    }

    // Check to see if we are re-evaluating history (e.g. there is already a stored next step)
    const existingNextStepIndex = this.#stepIndex + 1
    const existingNextStep = this.#steps[existingNextStepIndex]
    if (existingNextStep) {
      // The next step we would take is the same as the step that already exists in history
      if (deepEqual(nextStep, existingNextStep)) {
        this.#stepIndex++

        const lastStepIndex = this.#steps.length - 1
        if (this.#stepIndex === lastStepIndex) {
          this.#onUpdate()
        }

        return
      } else {
        console.debug(this.color, 'revising history. old:', existingNextStep, 'new:', nextStep)
        // We are revising history.
        this.#updateHistory(existingNextStepIndex)
      }
    }

    this.#addStep(nextStep)
  }

  #addStep (step) {
    this.#path.add(step.point)
    this.#steps.push(step)

    if (!step.tile.items.some((item) => item === this)) {
      // Add this beam to the tile item list so other beams can see it
      step.tile.addItem(this)
    }

    // Step index does not have to correspond to steps length if we are re-evaluating history
    this.#stepIndex++

    console.debug(this.color, 'added step', this.#stepIndex, step)

    this.#onUpdate(step)
  }

  #onCollision (step) {
    this.done = true
    emitEvent(Beam.Events.Collision, { beam: this, step, collision: step.state.collision })
  }

  #onConnection (step) {
    const connection = step.state.connection
    this.done = true
    connection.terminus.onConnection(connection.opening.direction)
    emitEvent(Beam.Events.Connection, { beam: this, step, connection })
  }

  #onOutOfBounds (step) {
    this.done = true
    emitEvent(Beam.Events.OutOfBounds, { beam: this, step })
  }

  #onUpdate (step) {
    if (step) {
      // There's probably a better way to do this...
      if (step.state.collision) {
        this.#onCollision(step)
      } else if (step.state.connection) {
        this.#onConnection(step)
      } else if (step.state.outOfBounds) {
        this.#onOutOfBounds(step)
      }
    }

    emitEvent(Beam.Events.Update, { beam: this, step })
  }

  #startDirection () {
    // Take rotation of the parent (terminus) into account
    return (this.#opening.direction + this.parent.rotateDirection) % 6
  }

  #updateHistory (stepIndex) {
    const lastStepIndex = this.#steps.length - 1
    const lastStep = this.#steps[lastStepIndex]
    const step = this.#steps[stepIndex]

    console.debug(this.color, 'updateState', 'new: ' + stepIndex, 'old: ' + lastStepIndex)

    if (step) {
      this.#path.removeSegments(step.segmentIndex)
      const deletedSteps = this.#steps.splice(stepIndex)

      console.debug(this.color, 'removed steps: ', deletedSteps)

      // Remove beam from tiles it is being removed from
      const tiles = [...new Set(deletedSteps.map((step) => step.tile))]
      tiles.forEach((tile) => tile.removeItem(this))

      // Handle any state changes from the previous last step
      const connection = lastStep.state.connection
      if (connection) {
        connection.terminus.onDisconnection(connection.opening.direction)
      }

      this.done = false
      this.#stepIndex = (stepIndex - 1)

      this.#onUpdate()
    }

    return step
  }

  static #getCollisions (tile, segments, puzzle) {
    const path = new Path({ segments })
    return tile.items
      .map((item) => {
        const compoundPath = new CompoundPath({
          // Must explicitly add insert: false for clone
          // https://github.com/paperjs/paper.js/issues/1721
          children: item.group.clone({ insert: false }).children
            .filter((child) => child.data.collidable !== false)
        })
        const intersections = path.getIntersections(compoundPath, (curveLocation) =>
          // Ignore the starting point since this will always collide with the beam itself
          item.type !== Item.Types.beam || !curveLocation.point.equals(segments[0]))
        if (puzzle.debug) {
          intersections.forEach((intersection) => puzzle.drawDebugPoint(intersection.point))
        }
        return { item, intersections }
      })
      .filter((result) => result.intersections.length)
      // We want to evaluate the intersections in order of occurrence
      .reverse()
  }

  static getNextPoint (point, length, direction) {
    const vector = new Point(0, 0)
    vector.length = length
    vector.angle = getConvertedDirection(direction) * 60
    return point.add(vector)
  }

  static Step = class {
    constructor (tile, color, direction, point, segmentIndex, state = {}) {
      this.color = color
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
      return new Beam.Step(
        step.tile,
        step.color,
        step.direction,
        step.point,
        step.segmentIndex,
        step.state
      ).update(options)
    }
  }

  static Events = Object.freeze({
    Collision: 'beam-collision',
    Connection: 'beam-connection',
    OutOfBounds: 'beam-out-of-bounds',
    Update: 'beam-update'
  })
}
