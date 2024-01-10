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
  uniqueBy, coalesce
} from '../util'
import { Step, StepState } from '../step'

export class Beam extends Item {
  done = false
  path = []
  sortOrder = 3

  #collisions = {}
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

  addCollision (stepIndex, collision) {
    this.#collisions[stepIndex] = { item: collision.item, point: collision.point ?? collision.points[0] }
  }

  addStep (step) {
    const lastStepIndex = this.getLastStepIndex()

    // Can't be done if adding a new step
    this.done = false

    const collisionStepIndexes = this.getCollisionStepIndexes()
    if (
      this.getCollisionLoopStepIndex() >= 0 &&
      lastStepIndex >= collisionStepIndexes[0] &&
      lastStepIndex <= collisionStepIndexes[collisionStepIndexes.length - 1]) {
      // Beam has a collision loop. In order to visualize that to the user, any step after the initial collision step,
      // up until the last collision step, will be marked as a projection to illustrate where the beam would travel
      // were it allowed to continue past the initial collision.
      step.projection = true
    }

    this.#path.opacity = step.projection ? 0.25 : 1
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
          step.insertAbove !== previousStep.insertAbove ||
          step.projection !== previousStep.projection
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
    this.#stepIndex = this.#steps.length - 1

    if (!step.tile.items.some((item) => item === this)) {
      // Add this beam to the tile item list so other beams can see it
      step.tile.addItem(this)
    }

    if (typeof step.onAdd === 'function') {
      step.onAdd()
    }

    console.debug(this.toString(), 'added step', this.#stepIndex, step)

    this.#onUpdate(this.#stepIndex)

    return step
  }

  getCollisionLoopStepIndex () {
    return this.getSteps().findIndex((step) => step.state.has(StepState.CollisionLoop))
  }

  getCollisionStepIndexes () {
    return Object.keys(this.#collisions).map((key) => Number(key)).sort((a, b) => a - b)
  }

  getCollisions () {
    return Object.values(this.#collisions)
  }

  getColor () {
    return this.getStep()?.color || this.getOpening().color
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

  getLastCollisionStepIndex () {
    const stepIndexes = this.getCollisionStepIndexes()
    return stepIndexes[stepIndexes.length - 1]
  }

  getLastStepIndex () {
    return this.length() - 1
  }

  getLayer () {
    return this.parent.getLayer()
  }

  getMergeWithStepIndex (beam) {
    return this.getSteps().findIndex((step) =>
      step.state.get(StepState.MergeWith)?.beams.some((mergedBeam) => mergedBeam.equals(beam)))
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
      if (
        collision?.item?.equals(beam) &&
        !beam.getSteps()
          .filter((step) => step.state.has(StepState.Collision))
          .map((step) => step.state.get(StepState.Collision))
          .some((otherCollision) =>
            otherCollision.item.equals(this) && fuzzyEquals(otherCollision.point, collision.point)
          )
      ) {
        console.debug(this.toString(), 're-evaluating collision with', beam.toString())
        this.done = false
        this.#stepIndex = Math.max(this.#stepIndex - 1, 0)
        return
      }

      // Check for invalid mergedInto
      const mergeInto = lastStep.state.get(StepState.MergeInto)
      if (mergeInto?.beam.equals(beam) && beam.getMergeWithStepIndex(this) < 0) {
        console.debug(this.toString(), 're-evaluating merge into', beam.toString())
        this.done = false
        this.#stepIndex = Math.max(this.#stepIndex - 1, 0)
        return
      }
    }

    // Check for invalid mergedWith
    const mergedWithStepIndex = this.getMergeWithStepIndex(beam)
    if (mergedWithStepIndex >= 0 && !beamLastStep?.state.get(StepState.MergeInto)?.beam.equals(this)) {
      console.debug(this.toString(), 're-evaluating merge with', beam.toString())
      this.done = false
      this.#stepIndex = Math.max(mergedWithStepIndex - 1, 0)
    }
  }

  onCollision (
    beam,
    puzzle,
    collision,
    collisionIndex,
    collisions,
    currentStep,
    currentStepIndex,
    nextStep,
    nextStepIndex,
    existingNextStep,
    collisionStep
  ) {
    console.debug(this.toString(), 'evaluating collision with', beam.toString())

    if (beam === this && collision.item === this && this.#stepIndex < this.getLastStepIndex()) {
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

    const point = collision.points[0]
    const currentStepCollision = currentStep.state.get(StepState.Collision)
    if (currentStepCollision?.item.equals(this) && fuzzyEquals(currentStepCollision.point, point)) {
      console.debug(this.toString(), 'ignoring collision with already collided beam', beam.toString())
      return
    }

    // Find the step with matching collision point
    const stepIndex = this.#steps.findLastIndex((step) => fuzzyEquals(point, step.point))
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
      const state = []
      const isSelf = beam.equals(this)

      console.debug(beam.toString(), 'has collided with', (isSelf ? 'self' : this.toString()), collision)

      beam.addCollision(nextStepIndex, collisionStep.state.get(StepState.Collision))

      // If this collision is already in the list, we are in a collision loop
      const ourCollisions = this.getCollisions()
      const isLoop = ourCollisions.some((collision) => fuzzyEquals(collision.point, point))
      if (isLoop) {
        const loop = ourCollisions.concat(beam.getCollisions())
        const beams = uniqueBy(loop.map((collision) => collision.item), 'id')
        console.log(this.toString(), 'collision loop detected between beams:', beams, loop)

        state.push(new StepState.CollisionLoop(loop))

        // Update any other beams that are involved but are not part of the collision we are resolving
        const collisionItemIds = [this.id, beam.id]
        beams
          .filter((beam) => !collisionItemIds.includes(beam.id) && beam.getCollisionLoopStepIndex() < 0)
          .forEach((beam) => {
            const points = loop.filter((collision) => collision.item.equals(beam)).map((collision) => collision.point)
            // Find the step with the earliest collision point
            const stepIndex = beam.getSteps()
              .findIndex((step) => points.some((point) => fuzzyEquals(point, step.point)))
            // Add collision loop to the step state at that point
            beam.updateStep(stepIndex, { state: beam.getStep(stepIndex).state.copy(...state) })
          })
      } else {
        this.addCollision(stepIndex, { item: beam, point })
      }

      // When colliding with self, no need to update since the collisionStep will take care of it
      if (!isSelf) {
        const collisionStepIndexes = this.getCollisionStepIndexes()
        const settings = {
          // Consider the beam done if not in a loop, or if the final collision point has been reached
          done: !isLoop || stepIndex === collisionStepIndexes[collisionStepIndexes.length - 1],
          state: step.state.copy(new StepState.Collision(point, beam), ...state)
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
        done: nextStepIndex === coalesce(nextStepIndex, beam.getLastCollisionStepIndex()),
        // Use same insertion point as the beam we collided with to ensure proper item hierarchy.
        insertAbove: step.insertAbove,
        state: collisionStep.state.copy(...state)
      })
    }

    // The beams are traveling in the same direction
    console.debug(this.toString(), 'merging with', beam.toString())

    // Update history to reflect changing color of path
    this.#updateHistory(stepIndex)

    const beams = [beam].concat(step.state.get(StepState.MergeWith)?.beams || [])
    this.addStep(step.copy({
      colors: step.colors.concat([beam.getColor()]),
      state: step.state.copy(new StepState.MergeWith(beams))
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
      this.addStep(new Step(tile, this.getColor(), this.startDirection(), tile.center))
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
      return this.updateStep(currentStepIndex, {
        done: true,
        state: new StepState(new StepState.Collision(currentStep.point))
      })
    }

    const nextStepIndex = currentStepIndex + 1
    const existingNextStep = this.#steps[nextStepIndex]
    const lastPathIndex = this.path.length - 1
    const lastSegmentIndex = this.path[lastPathIndex].segments.length - 1

    let nextStep = new Step(
      tile,
      currentStep.color,
      direction,
      nextStepPoint,
      existingNextStep?.pathIndex || lastPathIndex,
      existingNextStep?.segmentIndex || lastSegmentIndex,
      existingNextStep?.projection ?? currentStep.projection
    )

    const items = uniqueBy(
      tile.items.concat(currentStep.tile.equals(nextStep.tile) ? [] : currentStep.tile.items),
      'id'
    )

    console.debug(this.toString(), 'collision items:', items)

    // See if there are any collisions along the path we plan to take
    const collisions = this.#getCollisions(items, [currentStep.point, nextStep.point], puzzle)

    if (collisions.length) {
      console.debug(this.toString(), 'collisions:', collisions)
    }

    let collisionStep
    for (let collisionIndex = 0; collisionIndex < collisions.length; collisionIndex++) {
      const collision = collisions[collisionIndex]
      const point = collision.points[0]

      console.debug(this.toString(), 'resolving collision:', collision)

      // By default, the next step will be treated as a collision with the beam stopping at the first point of
      // intersection with the item.
      collisionStep = nextStep.copy({
        done: true,
        point,
        state: nextStep.state.copy(new StepState.Collision(point, collision.item))
      })

      // Allow the item to change the resulting step
      collisionStep = collision.item.onCollision(
        this,
        puzzle,
        collision,
        collisionIndex,
        collisions,
        currentStep,
        currentStepIndex,
        nextStep,
        nextStepIndex,
        existingNextStep,
        collisionStep
      )

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
      const updatedStep = step.copy(settings)
      this.#steps[stepIndex] = updatedStep
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

        return { item, points }
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
      this.done = step.done
    }

    if (this.done && !step.state.get(StepState.Collision)) {
      // If the beam ends without a collision, we can clear out any we have tracked
      this.#collisions = {}
    }

    emitEvent(Beam.Events.Update, { beam: this, state: step.state, step, stepIndex })
  }

  #updateHistory (stepIndex) {
    const lastStepIndex = this.getLastStepIndex()
    const lastStep = this.#steps[lastStepIndex]
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

      // Handle any state changes from the previous last step
      if (typeof lastStep.onRemove === 'function') {
        lastStep.onRemove()
      }

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

  static Events = Object.freeze({
    Collision: 'beam-collision',
    Connection: 'beam-connection',
    Merge: 'beam-merge',
    Update: 'beam-update'
  })
}
