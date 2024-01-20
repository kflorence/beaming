import chroma from 'chroma-js'
import { CompoundPath, Path, Point } from 'paper'
import { Item } from '../item'
import {
  getColorElements,
  emitEvent,
  fuzzyEquals,
  getConvertedDirection,
  getMidPoint,
  getDistance,
  getOppositeDirection,
  uniqueBy
} from '../util'
import { Step, StepState } from '../step'
import { Collision, CollisionMergeWith } from '../collision'
import { Cache } from '../cache'

export class Beam extends Item {
  done = false
  path = []
  sortOrder = 3

  #cache = new Cache(Object.values(Beam.CacheKeys))
  #direction
  #path
  #stepIndex = -1
  #steps = []

  constructor (terminus, state, configuration) {
    super(...arguments)

    this.group = null
    this.#direction = configuration.direction

    this.#path = {
      closed: false,
      data: { id: this.id, type: this.type },
      locked: true,
      strokeJoin: 'round',
      strokeWidth: terminus.radius / 12
    }
  }

  addStep (step) {
    const lastStepIndex = this.getLastStepIndex()

    // Can't be done if adding a new step
    this.done = false

    this.#path.strokeColor = step.color

    if (this.path.length === 0) {
      const path = new Path(this.#path)
      this.path.push(path)
      this.getLayer().insertChild(0, path)
    }

    const currentPath = this.path[this.path.length - 1]
    const previousStep = this.#steps[lastStepIndex]

    // Handles cases that require adding a new path item
    if (
      !step.connected || (
        previousStep && (
          step.color !== previousStep.color ||
          step.insertAbove !== previousStep.insertAbove
        )
      )
    ) {
      console.debug(this.toString(), 'adding new path item for step:', step, 'previous step:', previousStep)

      const path = new Path(this.#path)
      const points = [step.point]

      // If the next step is connected, we will link it with the previous step
      if (step.connected) {
        points.unshift(previousStep.point)
      }

      path.add(...points)
      this.path.push(path)

      const index = step.insertAbove ? step.insertAbove.getIndex() + 1 : 0

      // Unless specified in the state, the path will be inserted beneath all items
      this.getLayer().insertChild(index, path)

      // Reset the segmentIndex
      step.segmentIndex = 0
    } else {
      currentPath.add(step.point)
      step.segmentIndex = currentPath.segments.length - 1
    }

    step.pathIndex = this.path.length - 1

    this.#steps.push(step)

    step.index = this.#stepIndex = this.#steps.length - 1

    if (!step.tile.items.some((item) => item === this)) {
      // Add this beam to the tile item list so other beams can see it
      step.tile.addItem(this)
    }

    step.onAdd()

    console.debug(this.toString(), 'added step', step)

    this.#onUpdate(this.#stepIndex)

    return step
  }

  getCollision () {
    return this.getStep()?.state.get(StepState.Collision)
  }

  getColor () {
    return this.getStep()?.color || this.getOpening().color
  }

  getColors () {
    return Array.from(this.getStep()?.colors || this.getOpening().colors)
  }

  getColorElements (tile) {
    // Show color elements for merged beams
    const step = this.getSteps(tile).find((step) => step.state.has(StepState.MergeWith))
    return step ? getColorElements(step.color) : []
  }

  getCompoundPath () {
    return new CompoundPath({ children: this.path.map((item) => item.clone({ insert: false })) })
  }

  getIndex () {
    return this.path[this.path.length - 1].index
  }

  getLastStepIndex () {
    return this.length() - 1
  }

  getLayer () {
    return this.parent.getLayer()
  }

  getMergeWith (beam) {
    return this.#cache.get(Beam.CacheKeys.MergeWith).get(beam.id)
  }

  getOpening () {
    return this.parent.getOpening(this.#direction)
  }

  getState () {
    return this.parent.getState().openings[this.#direction]
  }

  getStep (stepIndex) {
    return this.#steps[stepIndex || this.getLastStepIndex()]
  }

  getSteps (tile) {
    return tile ? this.#steps.filter((step) => step.tile === tile) : this.#steps
  }

  isComplete () {
    return this.isOn() && this.done
  }

  isConnected () {
    const step = this.getStep()
    return step?.state.has(StepState.TerminusConnection) ||
      // Consider beams which have merged into connected beams to also be connected
      step?.state.get(StepState.MergeInto)?.beam.isConnected()
  }

  isOn () {
    const opening = this.getOpening()
    // The opening will also be on if another beam connects with it
    return opening.on && !opening.connected
  }

  isPending () {
    return this.isOn() && !this.done
  }

  length () {
    return this.#steps.length
  }

  onBeamUpdated (event) {
    const beam = event.detail.beam

    if (beam.isPending()) {
      // Wait for beam to finish before evaluating
      return
    }

    const beamLastStep = beam.getStep()

    if (this.isComplete()) {
      const lastStep = this.getStep()

      // Check for invalid collisions
      const collision = lastStep.state.get(StepState.Collision)
      if (collision?.has(beam) && !collision.equals(beamLastStep?.state.get(StepState.Collision))) {
        console.debug(this.toString(), 're-evaluating collision with', beam.toString())
        this.done = false
        this.#stepIndex = Math.max(lastStep.index - 1, 0)
        return
      }

      // Check for invalid mergedInto
      const mergeInto = lastStep.state.get(StepState.MergeInto)
      if (mergeInto?.beam.equals(beam) && !beam.getMergeWith(this)) {
        console.debug(this.toString(), 're-evaluating merge into', beam.toString())
        this.done = false
        this.#stepIndex = Math.max(this.#stepIndex - 1, 0)
        return
      }
    }

    // Check for invalid mergedWith
    const mergeWith = this.getMergeWith(beam)
    if (mergeWith && !beamLastStep?.state.get(StepState.MergeInto)?.beam.equals(this)) {
      console.debug(this.toString(), 're-evaluating merge with', beam.toString())
      this.done = false
      this.#stepIndex = Math.max(mergeWith.stepIndex - 1, 0)
    }
  }

  onCollision ({ beam, collision, collisionStep, currentStep, nextStep }) {
    const isSelf = beam.equals(this)

    console.debug(this.toString(), 'evaluating collision with', (isSelf ? 'self' : beam.toString()))

    if (isSelf && this.#stepIndex < this.getLastStepIndex()) {
      console.debug(this.toString(), 'ignoring collision with self while re-evaluating history')
      return
    }

    if (!beam.isPending()) {
      console.debug(this.toString(), 'ignoring collision with inactive beam', beam.toString())
      return
    }

    if (beam.parent.equals(this.parent) && nextStep.direction === beam.startDirection()) {
      console.debug(this.toString(), 'ignoring collision with sibling beam', beam.toString())
      return
    }

    // Find the step with matching collision point
    const stepIndex = this.#steps.findLastIndex((step) => fuzzyEquals(collision.point, step.point))
    if (stepIndex < 0) {
      // This error will occur if the steps are out of sync with the path segments for some reason
      throw new Error(
        `Could not find matching step for beam collision between ${this.toString()} and ${beam.toString()}`)
    }

    const step = this.#steps[stepIndex]

    if (step.state.get(StepState.MergeInto)?.beam.equals(beam)) {
      console.debug(this.toString(), 'ignoring collision with merged beam', beam.toString())
      return
    }

    // Note: we only want to evaluate this at the collision point, otherwise terminus connection is irrelevant.
    const terminusConnection = step.state.get(StepState.TerminusConnection)
    if (terminusConnection && terminusConnection.terminus.equals(beam.parent)) {
      console.debug(this.toString(), 'ignoring collision with connected beam in parent terminus', beam.toString())
      return
    }

    // Check for a reflection on either this beam or the one being collided with at the collision point.
    const reflector = step.state.get(StepState.Reflector) ?? currentStep.state.get(StepState.Reflector)
    if (reflector) {
      // Since every step goes to the center of the tile, we need to go one pixel back in the direction we came from
      // in order to properly test which side of the reflector the beams are on.
      const stepPoint = Beam.getNextPoint(step.point, 1, getOppositeDirection(step.direction))
      const nextStepPoint = Beam.getNextPoint(currentStep.point, 1, getOppositeDirection(currentStep.direction))
      if (!reflector.item.isSameSide(stepPoint, nextStepPoint)) {
        console.debug(this.toString(), 'ignoring collision with beam on opposite side of reflector', beam.toString())
        return
      }
    }

    // The beams are traveling in different directions, it's a collision
    if (step.direction !== nextStep.direction) {
      console.debug(beam.toString(), 'has collided with', (isSelf ? 'self' : this.toString()), collision)

      // When colliding with self, no need to update since the collisionStep will take care of it
      if (!isSelf) {
        const settings = {
          done: true,
          state: step.state.copy(new StepState.Collision(collision))
        }

        if (stepIndex < this.getLastStepIndex() && !step.state.has(StepState.Collision)) {
          // History must be updated if the collision occurred on an earlier step.
          // If the step already contains a collision in its state, do not update history as that step may be part
          // of a collision loop and updating will cause the infinite loop to continue.
          this.#updateHistory(stepIndex)
          this.addStep(step.copy(settings))
        } else {
          this.updateStep(stepIndex, settings)
        }
      }

      return collisionStep.copy({
        done: true,
        // Use same insertion point as the beam we collided with to ensure proper item hierarchy.
        insertAbove: step.insertAbove
      })
    }

    console.debug(this.toString(), 'merging with', beam.toString())

    // Update history to reflect changing color of path
    this.#updateHistory(stepIndex)

    const mergeWith = new CollisionMergeWith(beam, step, stepIndex)
    this.addStep(step.copy({
      colors: mergeWith.colors,
      onAdd: () => {
        this.#cache.get(Beam.CacheKeys.MergeWith).add(beam.id, mergeWith)
      },
      onRemove: () => {
        this.#cache.get(Beam.CacheKeys.MergeWith).remove(beam.id)
      },
      state: step.state.copy(new StepState.MergeWith(mergeWith))
    }))

    console.debug(beam.toString(), 'merging into', this.toString())

    return nextStep.copy({
      done: true,
      // Stop at current step point
      point: currentStep.point,
      state: nextStep.state.copy(new StepState.MergeInto(this))
    })
  }

  onModifierInvoked (event) {
    if (!this.isOn()) {
      if (this.#steps.length) {
        console.debug(this.toString(), 'beam has been toggled off')
        // Also reset any state changes from collision resolution
        this.updateState((state) => { delete state.collisions })
        this.remove()
      }
      return
    }

    const tiles = event.detail.tiles || [event.detail.tile]

    // We want the first step that contains the tile the event occurred on
    const stepIndex = this.#steps.findIndex((step) => tiles.some((tile) => tile.equals(step.tile)))
    if (stepIndex >= 0) {
      console.debug(this.toString(), 're-evaluating due to modifier being invoked in matching tile', stepIndex)
      // Re-evaluate beginning at the step before the matched one
      this.done = false
      this.#stepIndex = Math.max(stepIndex - 1, 0)
    }
  }

  remove (stepIndex = 0) {
    this.#updateHistory(stepIndex)
  }

  selected (selected = true) {
    this.path.forEach((path) => { path.selected = selected })
  }

  startDirection () {
    // Take rotation of the parent (terminus) into account
    return (this.getOpening().direction + this.parent.rotation) % 6
  }

  /**
   * On each step, a beam will move towards the edge of the current tile until it either reaches that point, or it
   * intersects with something else. A beam will be considered 'done' when it either collides with something or it
   * reaches a terminus opening.
   */
  step (puzzle) {
    if (!this.isPending()) {
      return
    }

    console.debug(this.toString(), 'currentStepIndex', this.#stepIndex)

    // First step
    if (this.#steps.length === 0) {
      const tile = this.parent.parent
      this.addStep(new Step(0, tile, this.getColor(), this.startDirection(), tile.center))
    }

    const currentStepIndex = this.#stepIndex
    const currentStep = this.#steps[currentStepIndex]

    // On the first step, we have to take the rotation of the terminus into account
    const direction = currentStepIndex === 0 ? this.startDirection() : currentStep.direction
    const nextStepPoint = Beam.getNextPoint(currentStep.point, currentStep.tile.parameters.inradius, direction)

    // Use the midpoint between the previous and next step points to calculate which tile we are in.
    // This will ensure we consistently pick the same tile when the next step point is on the edge of two tiles.
    const tile = puzzle.getTile(getMidPoint(currentStep.point, nextStepPoint))

    // The next step would be off the grid
    if (!tile) {
      console.debug(this.toString(), 'stopping due to out of bounds')

      const collision = new Collision(0, [currentStep.point], [this])
      return this.updateStep(currentStepIndex, {
        done: true,
        state: new StepState(new StepState.Collision(collision))
      })
    }

    const nextStepIndex = currentStepIndex + 1
    const existingNextStep = this.#steps[nextStepIndex]
    const lastPathIndex = this.path.length - 1
    const lastSegmentIndex = this.path[lastPathIndex].segments.length - 1

    let nextStep = new Step(
      nextStepIndex,
      tile,
      currentStep.color,
      direction,
      nextStepPoint,
      existingNextStep?.pathIndex || lastPathIndex,
      existingNextStep?.segmentIndex || lastSegmentIndex
    )

    const items = uniqueBy(
      tile.items.concat(currentStep.tile.equals(nextStep.tile) ? [] : currentStep.tile.items),
      'id'
    )

    console.debug(this.toString(), 'collision items:', items)

    // See if there are any collisions along the path we plan to take
    const collisions = this.#getCollisions(items, [currentStep.point, nextStep.point], puzzle)
      .map((collision, index) => new Collision(index, collision.points, [this, collision.item]))

    if (collisions.length) {
      console.debug(this.toString(), 'collisions:', collisions)
    }

    let collisionStep
    for (let collisionIndex = 0; collisionIndex < collisions.length; collisionIndex++) {
      const collision = collisions[collisionIndex]

      console.debug(this.toString(), 'resolving collision:', collision)

      // By default, the next step will be treated as a collision with the beam stopping at the first point of
      // intersection with the item.
      collisionStep = nextStep.copy({
        done: true,
        point: collision.point,
        state: nextStep.state.copy(new StepState.Collision(collision))
      })

      // Allow the item to change the resulting step
      collisionStep = collision.item.onCollision({
        beam: this,
        collision,
        collisions,
        collisionStep,
        currentStep,
        nextStep,
        existingNextStep,
        puzzle
      })

      if (collisionStep instanceof Step) {
        break
      }
    }

    if (collisionStep) {
      // Allow collision resolvers to stop execution
      if (collisionStep instanceof Step.Stop) {
        this.done = true
        this.#onUpdate()
        return collisionStep
      }
      nextStep = collisionStep
    }

    // See if we need to change history
    if (existingNextStep) {
      // The next step we would take is the same as the step that already exists in history
      if (nextStep.equals(existingNextStep)) {
        this.#stepIndex++

        const lastStepIndex = this.getLastStepIndex()
        console.debug(
          this.toString(),
          'new step is same as existing. new step index:',
          this.#stepIndex,
          'last step index:',
          lastStepIndex
        )

        if (this.#stepIndex === lastStepIndex) {
          // To ensure we mark as done
          this.#onUpdate(this.#stepIndex)
        }

        return existingNextStep
      } else {
        console.debug(this.toString(), 'is revising history')
        this.#updateHistory(nextStepIndex)
        // Ensure we have the correct path and segment index
        nextStep.pathIndex = this.path.length - 1
        nextStep.segmentIndex = this.path[nextStep.pathIndex].segments.length - 1
        console.debug(this.toString(), 'revised next step:', nextStep)
      }
    }

    if (currentStep.point.equals(nextStep.point)) {
      console.debug(this.toString(), 'next step point is same as current step point, stopping.', nextStep)
      return this.updateStep(currentStepIndex, nextStep)
    }

    return this.addStep(nextStep)
  }

  toString () {
    return `[${this.type}:${this.id}:${chroma(this.getColor()).name()}]`
  }

  updateState (updater, dispatchEvent = true) {
    return this.parent.updateState((state) => updater(state.openings[this.#direction]), dispatchEvent)
  }

  updateStep (stepIndex, settings) {
    const step = this.getStep(stepIndex)
    if (step) {
      // Handle (stepIndex, updater(step))
      if (typeof settings === 'function') {
        settings = settings(step, stepIndex)
      }

      const updatedStep = settings instanceof Step ? settings : step.copy(settings)

      this.#steps[stepIndex] = updatedStep
      updatedStep.onAdd()

      console.debug(this.toString(), 'updated step at index', stepIndex, 'from', step, 'to', updatedStep)
      this.#onUpdate(stepIndex)
      return updatedStep
    }
  }

  #getCollisions (items, segments, puzzle) {
    const path = new Path({ segments })
    const firstPoint = segments[0]
    return items
      .map((item) => {
        const points = []
        const intersections = path.getIntersections(
          item.getCompoundPath(),
          // Ignore first point from self which will always collide
          (curveLocation) => !(item === this && curveLocation.point.equals(firstPoint))
        )

        points.push(...new Set(intersections.map((intersection) => intersection.point)))

        // Handle the edge case of colliding with a beam with a single, isolated path item. This will happen in the
        // case of a portal exit collision, for example.
        if (!points.length && item.type === Item.Types.beam && item !== this) {
          points.push(
            ...item.getSteps().map((step) => step.point)
              .filter((point) => segments.some((segment) => fuzzyEquals(point, segment)))
          )
        }

        // Sort collision points by distance from origin point (closest collision points first)
        points.sort(getDistance(firstPoint))

        if (puzzle.debug) {
          puzzle.drawDebugPoint(firstPoint)
          points.forEach((point) => puzzle.drawDebugPoint(point, { fillColor: 'black' }))
        }

        return { points, item }
      })
      .filter((result) => result.points.length)
      .sort((a, b) => {
        // Sort items returned by proximity to starting point
        const distance = getDistance(firstPoint)(a.points[0], b.points[0])
        if (distance === 0) {
          // If two items are an equal distance away, sort by sort order as defined on item
          return a.item.sortOrder - b.item.sortOrder
        }

        return distance
      })
  }

  #onUpdate (stepIndex) {
    const lastStepIndex = this.getLastStepIndex()
    stepIndex ??= lastStepIndex

    const step = this.getStep(stepIndex)

    if (stepIndex === lastStepIndex) {
      // Update beam status if last step was updated
      this.done = step?.done ?? false
    }

    emitEvent(Beam.Events.Update, { beam: this, state: step?.state, step, stepIndex })
  }

  #updateHistory (stepIndex) {
    const lastStepIndex = this.getLastStepIndex()
    const step = this.#steps[stepIndex]

    console.debug(
      this.toString(),
      'updateHistory',
      'stepIndex:',
      stepIndex,
      'lastStepIndex:',
      lastStepIndex,
      'step:',
      step
    )

    if (step) {
      const currentPath = this.path[step.pathIndex]

      // Remove any now invalid path segments
      currentPath.removeSegments(step.segmentIndex)

      // If the current path is empty, remove it along with everything after it.
      const spliceIndex = step.pathIndex + (currentPath.segments.length === 0 ? 0 : 1)

      // Remove any now invalid path items
      this.path.splice(spliceIndex).forEach((item) => item.remove())

      const deletedSteps = this.#steps.splice(stepIndex)

      console.debug(this.toString(), 'removed steps: ', deletedSteps)

      // Remove beam from tiles it is being removed from
      const tiles = [...new Set(deletedSteps.map((step) => step.tile))]
      tiles.forEach((tile) => tile.removeItem(this))

      deletedSteps.forEach((step) => step.onRemove())

      this.done = false
      this.#stepIndex = (stepIndex - 1)

      this.#onUpdate(this.#stepIndex)
    }

    return step
  }

  static getNextPoint (point, length, direction) {
    const vector = new Point(0, 0)
    vector.length = length
    vector.angle = getConvertedDirection(direction) * 60
    return point.add(vector)
  }

  static CacheKeys = Object.freeze({
    MergeWith: 'mergeWith'
  })

  static Events = Object.freeze({
    Collision: 'beam-collision',
    Connection: 'beam-connection',
    Merge: 'beam-merge',
    Update: 'beam-update'
  })
}
