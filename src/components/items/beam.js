import { CompoundPath, Group, Path, Point } from 'paper'
import { Item } from '../item'
import { emitEvent, getConvertedDirection } from '../util'
import { Modifier } from '../modifier'

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
    return this.#opening.on && !this.done
  }

  getConnection () {
    return this.getLastStep()?.state.connection
  }

  getLastStep () {
    return this.#steps[this.#steps.length - 1]
  }

  onCollision (beam, collision, currentStep, nextStep, collisionStep) {
    const lastStepIndex = this.#steps.length - 1
    if (collision.item === this && this.#stepIndex < lastStepIndex) {
      console.log(this.color, 'ignoring collision with self when re-evaluating history', this.#stepIndex, lastStepIndex)
      return
    }

    return collisionStep
  }

  onModifierInvoked (event) {
    if (!this.#opening.on) {
      // If the beam is off but has steps, we should get rid of them (toggled off).
      if (this.#steps.length) {
        this.#updateState(0)
      }
      return
    }

    console.log(this.color, 'onModifierInvoked', event)

    // We want the first step that contains the tile the event occurred on
    const stepIndex = this.#steps.findIndex((step) => step.tile === event.detail.tile)
    if (stepIndex >= 0) {
      // Mark as not done to trigger the processing of another step
      this.done = false
      // Begin re-evaluating at this index
      this.#stepIndex = stepIndex
      return
    }

    const modifier = event.detail.modifier
    const terminus = event.detail.items.find((item) => item.type === Item.Types.terminus)
    const collisionItem = this.getLastStep()?.state.collision?.item
    if (
      modifier.type === Modifier.Types.toggle &&
      collisionItem?.type === Item.Types.beam &&
      terminus?.beams.some((beam) => !beam.isActive() && beam === collisionItem)) {
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

    console.log(this.color, 'step', this.#stepIndex, currentStep)

    // The next step would be off the grid
    if (!tile) {
      console.log(this.color, 'stopping due to out of bounds')
      this.#onOutOfBounds(Beam.Step.from(currentStep, { state: { outOfBounds: true } }))
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
    // .sort((a, b) => a.item.sortOrder - b.item.sortOrder)
    // .sort((collision) => {
    //   // Ensure that if we are re-evaluating history that contained a collision, we re-evaluate that collision first
    //   const previousFirstPoint = currentStep.state.collision?.intersections[0].point
    //   return previousFirstPoint ? (collision.intersections[0].point.equals(previousFirstPoint) ? -1 : 0) : 0
    // })

    let collisionStep
    for (const collision of collisions) {
      console.log(this.color, 'collision', collision)

      // By default, the next step will be treated as a collision with the beam stopping at the first point of
      // intersection with the item.
      collisionStep = Beam.Step.from(nextStep, { point: collision.intersections[0].point, state: { collision } })

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

    let stateUpdated = false

    // Check to see if we are re-evaluating history (e.g. there is already a stored next step)
    const existingNextStepIndex = this.#stepIndex + 1
    const existingNextStep = this.#steps[existingNextStepIndex]
    if (existingNextStep) {
      // The next step we would take is the same as the step that already exists in history
      if (nextStep.equals(existingNextStep)) {
        this.#stepIndex++

        const lastStepIndex = this.#steps.length - 1
        if (this.#stepIndex === lastStepIndex) {
          // We have reached the end, nothing left to do
          this.done = true
        }

        return
      } else {
        // We are revising history.
        this.#updateState(existingNextStepIndex)
        stateUpdated = true
      }
    }

    this.#addStep(nextStep)
    if (stateUpdated) {
      emitEvent(Beam.Events.Update, { beam: this, tile })
    }
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

    console.log(this.color, 'added step', this.#stepIndex, step)

    // There's probably a better way to do this...
    if (step.state.collision) {
      this.#onCollision(step)
    } else if (step.state.connection) {
      this.#onConnection(step)
    } else if (step.state.outOfBounds) {
      this.#onOutOfBounds(step)
    }
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

  #startDirection () {
    // Take rotation of the parent (terminus) into account
    return (this.#opening.direction + this.parent.rotateDirection) % 6
  }

  #updateState (stepIndex) {
    const lastStepIndex = this.#steps.length - 1
    const lastStep = this.#steps[lastStepIndex]
    const step = this.#steps[stepIndex]

    console.log(this.color, 'updateState', 'new: ' + stepIndex, 'old: ' + lastStepIndex)

    if (step) {
      this.#path.removeSegments(step.segmentIndex)
      const deletedSteps = this.#steps.splice(stepIndex)

      console.log(this.color, 'removed steps: ', deletedSteps)

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

    equals (other) {
      // We can't use === for some of the PaperJS objects
      return this.color === other.color &&
        this.direction === other.direction &&
        this.point.equals(other.point) &&
        this.segmentIndex === other.segmentIndex &&
        this.tile === other.tile &&
        this.stateEquals(other.state)
    }

    stateEquals (otherState) {
      if (otherState.collision) {
        return this.state.collision.item === otherState.collision.item &&
          this.state.collision.intersections.every((intersection, index) =>
            // For some reason intersection.equals() is not working here, even though they look the same. Bug?
            // The toString approximation seems good enough for our use case here
            intersection.toString() === otherState.collision.intersections[index]?.toString())
      }

      return this.state === otherState
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
