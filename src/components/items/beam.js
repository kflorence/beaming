import { CompoundPath, Path, Point } from 'paper'
import { Item } from '../item'
import { deepEqual, emitEvent, getConvertedDirection } from '../util'

export class Beam extends Item {
  done = false
  path = []
  type = Item.Types.beam

  #opening
  #path

  #stepIndex = -1
  #steps = []

  constructor (terminus, opening) {
    super(...arguments)

    this.direction = opening.direction
    this.width = terminus.radius / 12

    this.#opening = opening
    this.#path = {
      closed: false,
      data: { id: this.id, type: this.type },
      locked: true,
      strokeColor: opening.color,
      strokeJoin: 'round',
      strokeWidth: this.width
    }
  }

  isActive () {
    return this.#opening.on && !this.#opening.connected && !this.done
  }

  getCompoundPath () {
    return new CompoundPath({ children: this.path.map((item) => item.clone({ insert: false })) })
  }

  getConnection () {
    return this.getLastStep()?.state.connection
  }

  getIndex () {
    return this.path[this.path.length - 1].index
  }

  getLastStep () {
    return this.#steps[this.#steps.length - 1]
  }

  getLayer () {
    return this.parent.getLayer()
  }

  getSteps (tile) {
    return this.#steps.filter((step) => step.tile === tile)
  }

  onCollision (beam, puzzle, collision, currentStep, nextStep, collisionStep) {
    const lastStepIndex = this.#steps.length - 1
    if (beam === this && collision.item === this && this.#stepIndex < lastStepIndex) {
      console.debug(
        this.id,
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
        this.remove()
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

  remove () {
    this.#updateHistory(0)
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
      this.#addStep(new Beam.Step(tile, this.#opening.color, this.#startDirection(), tile.center, 0, 0))
    }

    const currentStep = this.#steps[this.#stepIndex]

    // On the first step, we have to take the rotation of the terminus into account
    const direction = this.#stepIndex === 0 ? this.#startDirection() : currentStep.direction
    const nextPoint = Beam.getNextPoint(currentStep.point, currentStep.tile.parameters.inradius, direction)
    const tile = puzzle.getTile(nextPoint)

    // The next step would be off the grid
    if (!tile) {
      console.debug(this.id, 'stopping due to out of bounds')
      currentStep.state = { collision: { outOfBounds: true } }
      this.#onUpdate(currentStep)
      return
    }

    let nextStep = new Beam.Step(
      tile,
      currentStep.color,
      direction,
      nextPoint,
      currentStep.pathIndex,
      currentStep.segmentIndex + 1
    )

    const items = [tile.items]
    if (!currentStep.tile.equals(nextStep.tile)) {
      // Add items from the tile we are moving out of
      items.unshift(currentStep.tile.items)
    }

    // See if there are any collisions along the path we plan to take
    const collisions = Beam.#getCollisions(items.flat(), [currentStep.point, nextStep.point], puzzle)

    let collisionStep
    for (const collision of collisions) {
      console.debug(this.id, 'resolving step collision:', collision)

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
      collisionStep = collision.item.onCollision(this, puzzle, collision, currentStep, nextStep, collisionStep)

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
        console.debug(this.id, 'revising history. old:', existingNextStep, 'new:', nextStep)
        // We are revising history.
        this.#updateHistory(existingNextStepIndex)
      }
    }

    if (currentStep.point.equals(nextStep.point)) {
      console.error(this.id, 'loop detected, exiting')
      this.done = true
      return
    }

    this.#addStep(nextStep)
  }

  #addStep (step) {
    if (this.path.length === 0) {
      const path = new Path(this.#path)
      this.path.push(path)
      this.getLayer().insertChild(0, path)
    }

    const currentPath = this.path[step.pathIndex]
    const previousStep = this.#steps[this.#steps.length - 1]

    // Handles cases that require adding a new path item
    if (
      previousStep && (
        step.state.disconnect ||
        previousStep.color !== step.color ||
        previousStep.state.index !== step.state.index
      )
    ) {
      currentPath.set({ closed: true })

      this.#path.strokeColor = step.color

      const path = new Path(this.#path)
      const points = [step.point]

      // If the next step is not disconnected, we will link it with the previous step
      if (!step.state.disconnect) {
        points.unshift(previousStep.point)
      }

      path.add(...points)

      const pathIndex = this.path.push(path) - 1

      // Unless specified in the state, the path will be inserted beneath all items
      this.getLayer().insertChild(step.state.index || 0, path)

      step.pathIndex = pathIndex
    } else {
      currentPath.add(step.point)
    }

    this.#steps.push(step)

    if (!step.tile.items.some((item) => item === this)) {
      // Add this beam to the tile item list so other beams can see it
      step.tile.addItem(this)
    }

    // Step index does not have to correspond to steps length if we are re-evaluating history
    this.#stepIndex++

    console.debug(this.id, 'added step', this.#stepIndex, step)

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

    console.debug(this.id, 'updateState', 'new: ' + stepIndex, 'old: ' + lastStepIndex)

    if (step) {
      const nextPathIndex = step.pathIndex + 1

      // Remove any path items after the current one
      if (this.path[nextPathIndex]) {
        this.path.splice(nextPathIndex).forEach((item) => item.remove())
      }

      // Remove any segments from the current path item after the segment index
      this.path[step.pathIndex].removeSegments(step.segmentIndex)

      const deletedSteps = this.#steps.splice(stepIndex)

      console.debug(this.id, 'removed steps: ', deletedSteps)

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

  static #getCollisions (items, segments, puzzle) {
    const path = new Path({ segments })
    return items
      .map((item) => {
        const intersections = path.getIntersections(item.getCompoundPath(), (curveLocation) =>
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
    constructor (tile, color, direction, point, pathIndex, segmentIndex, state = {}) {
      this.color = color
      this.direction = direction
      this.point = point
      this.pathIndex = pathIndex
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
        step.pathIndex,
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
