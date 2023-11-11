import chroma from 'chroma-js'
import { CompoundPath, Path, Point } from 'paper'
import { Item } from '../item'
import { deepEqual, emitEvent, getConvertedDirection } from '../util'

export class Beam extends Item {
  done = false
  path = []
  sortOrder = 2
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

  addStep (step) {
    this.done = false

    if (this.path.length === 0) {
      const path = new Path(this.#path)
      this.path.push(path)
      this.getLayer().insertChild(0, path)
    }

    const currentPath = this.path[this.path.length - 1]
    const previousStep = this.#steps[this.#steps.length - 1]

    // Handles cases that require adding a new path item
    if (
      previousStep && (
        step.color !== previousStep.state.color ||
        step.state.disconnect ||
        (step.state.insertAbove && !step.state.insertAbove.equals(previousStep.state.insertAbove))
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
      const index = step.state.insertAbove ? step.state.insertAbove.getIndex() + 1 : 0

      // Unless specified in the state, the path will be inserted beneath all items
      this.getLayer().insertChild(index, path)

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

  isActive () {
    return this.isOn() && !this.done
  }

  isOn () {
    // The opening will also be on if another beam connects with it
    return this.#opening.on && !this.#opening.connected
  }

  merge (collision, beam) {
    const step = this.#collision(collision)

    if (step) {
      const color = chroma.average([step.color, beam.getLastStep().color]).hex()
      const state = Object.assign(step.state, { merged: beam })
      this.addStep(Beam.Step.from(step, { color, state }))
    }
  }

  onCollision (beam, puzzle, collision, collisionIndex, collisions, currentStep, nextStep, collisionStep) {
    const lastStepIndex = this.#steps.length - 1
    const isExistingStep = this.#stepIndex < lastStepIndex
    if (beam === this && collision.item === this && isExistingStep) {
      console.debug(
        this.id,
        'ignoring collision with self while re-evaluating history',
        'current index: ' + this.#stepIndex,
        'last index: ' + lastStepIndex
      )
      return
    }

    console.debug(this.id, 'collision with beam', beam.id)

    // Update history to collision location
    const step = this.#collision(collision)

    // The beams are traveling in different directions, it's a collision
    if (step.direction !== nextStep.direction) {
      const state = Object.assign(step.state, Beam.getCollisionState(collision))
      state.collision.item = beam
      this.addStep(Beam.Step.from(step, { state }))

      // Use same insertion point as the beam we collided with to ensure proper item hierarchy.
      collisionStep.state.insertAbove = step.state.insertAbove

      return collisionStep
    }

    // The beams are traveling in the same direction, merge this one into the other one
    const color = chroma.average([step.color, beam.getLastStep().color]).hex()
    const state = Object.assign(step.state, { merged: beam })
    this.addStep(Beam.Step.from(step, { color, state }))

    return Beam.Step.from(nextStep, { state: { merge: this } })
  }

  onModifierInvoked (event, puzzle) {
    console.debug(this.id, this.getLastStep()?.color, 'onModifierInvoked', event)

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
      return this.step(puzzle)
    }

    const lastStep = this.getLastStep()
    if (lastStep) {
      const collisionItem = lastStep.state.collision?.item
      if (!lastStep.tile.items.some((item) => item === collisionItem)) {
        // Re-evaluate last step since the item we collided with is no longer in the tile
        this.#updateHistory(this.#steps.length - 1)
        return this.step(puzzle)
      }
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
      this.addStep(new Beam.Step(tile, this.#opening.color, this.#startDirection(), tile.center, 0, 0))
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

    const nextStepIndex = this.#stepIndex + 1
    const existingNextStep = this.#steps[nextStepIndex]

    let nextStep = new Beam.Step(
      tile,
      existingNextStep?.color || currentStep.color,
      direction,
      nextPoint,
      existingNextStep?.pathIndex || currentStep.pathIndex + 1,
      existingNextStep?.segmentIndex || currentStep.segmentIndex + 1
    )

    const items = [tile.items]
    if (!currentStep.tile.equals(nextStep.tile)) {
      // Add items from the tile we are moving out of
      items.unshift(currentStep.tile.items)
    }

    // See if there are any collisions along the path we plan to take
    const collisions = this.#getCollisions(items.flat(), [currentStep.point, nextStep.point], puzzle)

    let collisionStep
    for (let collisionIndex = 0; collisionIndex < collisions.length; collisionIndex++) {
      const collision = collisions[collisionIndex]

      console.debug(this.id, 'resolving collision:', collision)

      const state = Beam.getCollisionState(collision)

      // By default, the next step will be treated as a collision with the beam stopping at the first point of
      // intersection with the item.
      collisionStep = Beam.Step.from(nextStep, { point: state.collision.point, state })

      // Allow the item to change the resulting step
      collisionStep = collision.item.onCollision(
        this,
        puzzle,
        collision,
        collisionIndex,
        collisions,
        currentStep,
        nextStep,
        collisionStep
      )

      if (collisionStep instanceof Beam.Step) {
        break
      }
    }

    if (collisionStep) {
      // Allow collision resolvers to stop execution
      if (collisionStep === Beam.Stop) {
        this.done = true
        return
      }
      nextStep = collisionStep
    }

    // See if we need to change history
    if (existingNextStep) {
      // The next step we would take is the same as the step that already exists in history
      if (deepEqual(nextStep, existingNextStep)) {
        this.#stepIndex++

        const lastStepIndex = this.#steps.length - 1
        console.debug(this.id, 'new step is same as existing. new step index:', this.#stepIndex, 'last step index:', lastStepIndex)
        if (this.#stepIndex === lastStepIndex) {
          this.#onUpdate()
          return
        } else {
          return this.step(puzzle)
        }
      } else {
        console.debug(this.id, 'revising history. old:', existingNextStep, 'new:', nextStep)
        // We are revising history.
        this.#updateHistory(nextStepIndex)
      }
    }

    if (currentStep.point.equals(nextStep.point)) {
      console.error(this.id, 'loop detected, exiting')
      this.done = true
      return
    }

    this.addStep(nextStep)
  }

  #collision (collision) {
    const points = [...new Set(collision.intersections.map((intersection) => intersection.point))]
    return this.#updateHistory(
      this.#steps.findLastIndex((step) =>
        points.some((point) => point.ceil().subtract(step.point.floor()).length <= 5)))
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

  #onMerge (step) {
    const otherBeam = step.state.merge
    this.done = true
    emitEvent(Beam.Events.Merge, { beam: this, otherBeam, step })
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
      } else if (step.state.merge) {
        this.#onMerge(step)
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
      // Remove now invalid path items
      this.path.splice(step.pathIndex).forEach((item) => item.remove())

      // Remove any now invalid segments from the now current path item
      const lastPathIndex = this.path.length - 1
      if (lastPathIndex >= 0) {
        this.path[lastPathIndex].removeSegments(step.segmentIndex)
      }

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

  #getCollisions (items, segments, puzzle) {
    const path = new Path({ segments })
    const { 0: firstPoint, [segments.length - 1]: lastPoint } = segments
    return items
      .map((item) => {
        const intersections = path.getIntersections(item.getCompoundPath(), (curveLocation) =>
          // Ignore last point from self
          !(item === this && curveLocation.point.equals(firstPoint)))
        if (puzzle.debug) {
          intersections.forEach((intersection) => puzzle.drawDebugPoint(intersection.point))
        }
        return { item, intersections }
      })
      .filter((result) => result.intersections.length)
      .sort((a, b) => {
        const sortOrder = a.item.sortOrder - b.item.sortOrder
        // First sort by precedence as defined on the item
        if (sortOrder !== 0) {
          return sortOrder
        } else {
          // If they are the same, sort by distance of closest intersection point from target point
          const closestPointA = a.intersections.map((i) => i.point).sort(Beam.sortByDistance(lastPoint)).shift()
          const closestPointB = b.intersections.map((i) => i.point).sort(Beam.sortByDistance(lastPoint)).shift()
          return Beam.sortByDistance(lastPoint)(closestPointA, closestPointB)
        }
      })
  }

  static sortByDistance (targetPoint) {
    return (a, b) => a.subtract(targetPoint).length - b.subtract(targetPoint).length
  }

  static getCollisionState (collision) {
    const item = collision.item
    const point = collision.intersections[0].point
    return { collision: { item, point } }
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

  static Stop = new Beam.Step(null, null, null, null, null, null, { stop: true })

  static Events = Object.freeze({
    Collision: 'beam-collision',
    Connection: 'beam-connection',
    Merge: 'beam-merge',
    OutOfBounds: 'beam-out-of-bounds',
    Update: 'beam-update'
  })
}
