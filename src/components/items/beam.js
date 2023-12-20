import chroma from 'chroma-js'
import { CompoundPath, Path, Point } from 'paper'
import { Item } from '../item'
import {
  getColorElements,
  deepEqual,
  emitEvent,
  fuzzyEquals,
  getConvertedDirection,
  getMidPoint,
  sortByDistance
} from '../util'
import { BeamState, BeamStateCollision, BeamStateMergeInto, BeamStateMergeWith, BeamStateTerminus } from '../beamState'

let counter = 0

export class Beam extends Item {
  done = false
  path = []
  sortOrder = 2

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
    this.done = false
    this.#path.strokeColor = step.color

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
        step.color !== previousStep.color ||
        step.state?.disconnect ||
        !step.state?.insertAbove?.equals(previousStep.state?.insertAbove)
      )
    ) {
      currentPath.set({ closed: true })

      const path = new Path(this.#path)
      const points = [step.point]

      // If the next step is not disconnected, we will link it with the previous step
      if (!step.state?.disconnect) {
        points.unshift(previousStep.point)
      }

      path.add(...points)

      const pathIndex = this.path.push(path) - 1
      const index = step.state?.insertAbove ? step.state.insertAbove.getIndex() + 1 : 0

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

    step.onAdd()

    console.debug(this.toString(), 'added step', this.#stepIndex, step)

    this.#onUpdate(step)
  }

  getColor () {
    return this.getStep()?.color || this.getOpening().color
  }

  getColorElements (tile) {
    // Show color elements for merged beams
    const step = this.getSteps(tile).find((step) => step.state?.is(BeamStateMergeWith))
    return step ? getColorElements(step.color) : []
  }

  getCompoundPath () {
    return new CompoundPath({ children: this.path.map((item) => item.clone({ insert: false })) })
  }

  getIndex () {
    return this.path[this.path.length - 1].index
  }

  getLayer () {
    return this.parent.getLayer()
  }

  getMergeWithStepIndex (beam) {
    return this.getSteps().findIndex((step) =>
      step.state?.get(BeamStateMergeWith)?.beams.some((mergedBeam) => mergedBeam.equals(beam)))
  }

  getOpening () {
    return this.parent.getOpening(this.#direction)
  }

  getState () {
    return this.parent.getState().openings[this.#direction]
  }

  getStep (stepIndex) {
    return this.#steps[stepIndex || this.lastStepIndex()]
  }

  getSteps (tile) {
    return tile ? this.#steps.filter((step) => step.tile === tile) : this.#steps
  }

  isComplete () {
    return this.isOn() && this.done
  }

  isConnected () {
    const step = this.getStep()
    return step?.state.is(BeamStateTerminus) ||
      // Consider beams which have merged into connected beams to also be connected
      step?.state.get(BeamStateMergeInto)?.beam.isConnected()
  }

  isOn () {
    const opening = this.getOpening()
    // The opening will also be on if another beam connects with it
    return opening.on && !opening.connected
  }

  isPending () {
    return this.isOn() && !this.done
  }

  lastStepIndex () {
    return this.length() - 1
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

    console.debug(this.toString(), 'onBeamUpdated', event)

    const beamLastStep = beam.getStep()

    if (this.isComplete()) {
      const lastStep = this.getStep()

      // Check for invalid collisions
      const collision = lastStep.state.get(BeamStateCollision)
      if (
        collision?.item.equals(beam) &&
        !beamLastStep?.state.get(BeamStateCollision)?.point.equals(lastStep.state.point)
      ) {
        console.debug(this.toString(), 're-evaluating collision with', beam.toString())
        this.done = false
        this.#stepIndex = Math.max(this.#stepIndex - 1, 0)
        return
      }

      // Check for invalid mergedInto
      const mergeInto = lastStep.state.get(BeamStateMergeInto)
      if (mergeInto?.beam.equals(beam) && beam.getMergeWithStepIndex(this) < 0) {
        console.debug(this.toString(), 're-evaluating merge into', beam.toString())
        this.done = false
        this.#stepIndex = Math.max(this.#stepIndex - 1, 0)
        return
      }
    }

    // Check for invalid mergedWith
    const mergedWithStepIndex = this.getMergeWithStepIndex(beam)
    if (mergedWithStepIndex >= 0 && !beamLastStep?.state.get(BeamStateMergeInto)?.beam.equals(this)) {
      console.debug(this.toString(), 're-evaluating merged with', beam.toString())
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
    nextStep,
    existingNextStep,
    collisionStep
  ) {
    console.debug(this.toString(), 'onCollision', collision.points, beam.toString())

    if (!beam.isPending()) {
      console.debug(this.toString(), 'ignoring collision with inactive beam', beam.toString())
      return
    }

    if (beam.parent.equals(this.parent) && nextStep.direction === beam.startDirection()) {
      console.debug(this.toString(), 'ignoring collision with sibling beam', beam.toString())
      return
    }

    const lastStep = this.getStep()

    if (lastStep?.state.get(BeamStateMergeInto)?.beam.equals(beam)) {
      console.debug(this.toString(), 'ignoring collision with merged beam', beam.toString())
      return
    }

    if (lastStep?.state.get(BeamStateTerminus)?.terminus.equals(beam.parent)) {
      console.debug(this.toString(), 'ignoring collision with connected beam', beam.toString())
      return
    }

    const lastStepIndex = this.lastStepIndex()
    if (beam === this && collision.item === this && this.#stepIndex < lastStepIndex) {
      console.debug(
        this.toString(),
        'ignoring collision with self while re-evaluating history',
        'current index: ' + this.#stepIndex,
        'last index: ' + lastStepIndex
      )
      return
    }

    // Find the step with matching collision point
    const stepIndex = this.#steps
      .findLastIndex((step) => collision.points.some((point) => fuzzyEquals(point, step.point)))
    const step = this.#steps[stepIndex]
    const isLastStep = stepIndex === lastStepIndex

    // The beams are traveling in different directions, it's a collision
    if (step.direction !== nextStep.direction) {
      console.debug(this.toString(), 'collision with beam', beam.toString())

      if (!step.state.is(BeamStateCollision)) {
        if (!isLastStep) {
          // If matched step is not last step, update history
          this.#updateHistory(stepIndex)
        }

        step.state = new BeamStateCollision(step.state, { collision, item: beam })

        if (isLastStep) {
          this.#onUpdate()
        } else {
          this.addStep(step)
        }
      }

      if (step.state.insertAbove) {
        // Use same insertion point as the beam we collided with to ensure proper item hierarchy.
        collisionStep.state.insertAbove = step.state.insertAbove
      }

      return collisionStep
    }

    // The beams are traveling in the same direction
    console.debug(this.toString(), 'merging with', beam.toString())

    // Since the path color is changing, we always have to update history here
    // TODO: update path only if current step is last step
    this.#updateHistory(stepIndex)

    this.addStep(step.copy({
      colors: step.colors.concat([beam.getColor()]),
      state: new BeamStateMergeWith(step.state, { beam: beam })
    }))

    counter++

    // FIXME
    if (counter > 3) throw new Error('stop')

    return currentStep.copy({ state: new BeamStateMergeInto(currentStep.state, { beam: this }) })
  }

  onModifierInvoked (event) {
    console.debug(this.toString(), 'onModifierInvoked', event)

    if (!this.isOn()) {
      // If the beam is off but has steps, we should get rid of them (toggled off).
      if (this.#steps.length) {
        // Also reset any state changes from collision resolution
        this.updateState((state) => { delete state.collisions })
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
    }
  }

  remove (stepIndex = 0) {
    this.#updateHistory(stepIndex)
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

    console.debug(this.toString(), 'stepIndex = ', this.#stepIndex)

    // First step
    if (this.#steps.length === 0) {
      const tile = this.parent.parent
      this.addStep(new BeamStep(tile, this.getColor(), this.startDirection(), tile.center, 0, 0))
    }

    const currentStep = this.#steps[this.#stepIndex]

    // On the first step, we have to take the rotation of the terminus into account
    const direction = this.#stepIndex === 0 ? this.startDirection() : currentStep.direction
    const nextStepPoint = Beam.getNextPoint(currentStep.point, currentStep.tile.parameters.inradius, direction)

    // Use the midpoint between the previous and next step points to calculate which tile we are in.
    // This will ensure we consistently pick the same tile when the next step point is on the edge of two tiles.
    const tile = puzzle.getTile(getMidPoint(currentStep.point, nextStepPoint))

    // The next step would be off the grid
    if (!tile) {
      console.debug(this.toString(), 'stopping due to out of bounds')
      currentStep.state = new BeamStateCollision(currentStep.state, { point: currentStep.point })
      this.#onUpdate()
      return
    }

    const nextStepIndex = this.#stepIndex + 1
    const existingNextStep = this.#steps[nextStepIndex]

    let nextStep = new BeamStep(
      tile,
      currentStep.color,
      direction,
      nextStepPoint,
      existingNextStep?.pathIndex || currentStep.pathIndex + 1,
      existingNextStep?.segmentIndex || currentStep.segmentIndex + 1
    )

    const items = tile.items.concat(currentStep.tile.equals(nextStep.tile) ? [] : currentStep.tile.items)

    console.debug(this.toString(), 'collision items:', items)

    // See if there are any collisions along the path we plan to take
    const collisions = this.#getCollisions(items, [currentStep.point, nextStep.point], puzzle)

    console.debug(this.toString(), 'collisions:', collisions)

    let collisionStep
    for (let collisionIndex = 0; collisionIndex < collisions.length; collisionIndex++) {
      const collision = collisions[collisionIndex]

      console.debug(this.toString(), 'resolving collision:', collision)

      // By default, the next step will be treated as a collision with the beam stopping at the first point of
      // intersection with the item.
      collisionStep = nextStep.copy({
        point: collision.points[0],
        state: new BeamStateCollision(nextStep.state, { collision })
      })

      // Allow the item to change the resulting step
      collisionStep = collision.item.onCollision(
        this,
        puzzle,
        collision,
        collisionIndex,
        collisions,
        currentStep,
        nextStep,
        existingNextStep,
        collisionStep
      )

      if (collisionStep instanceof BeamStep) {
        break
      }
    }

    if (collisionStep) {
      // Allow collision resolvers to stop execution
      if (collisionStep instanceof BeamStop) {
        this.#onUpdate()
        return
      }
      nextStep = collisionStep
    }

    // See if we need to change history
    if (existingNextStep) {
      // The next step we would take is the same as the step that already exists in history
      if (nextStep.equals(existingNextStep)) {
        this.#stepIndex++

        const lastStepIndex = this.lastStepIndex()
        console.debug(this.toString(), 'new step is same as existing. new step index:', this.#stepIndex, 'last step index:', lastStepIndex)
        if (this.#stepIndex === lastStepIndex) {
          this.#onUpdate()
          return
        } else {
          return this.step(puzzle)
        }
      } else {
        console.debug(this.toString(), 'revising history. old:', existingNextStep, 'new:', nextStep)
        // We are revising history.
        this.#updateHistory(nextStepIndex)
      }
    }

    if (currentStep.point.equals(nextStep.point)) {
      console.debug(this.toString(), 'unable to advance, exiting')
      // Merge the state from next step into the current step
      Object.assign(currentStep.state, nextStep.state)
      this.#onUpdate(currentStep)
      return
    }

    this.addStep(nextStep)
  }

  toString () {
    return `[${this.type}:${this.id}:${chroma(this.getColor()).name()}]`
  }

  updateState (updater, dispatchEvent = true) {
    return this.parent.updateState((state) => updater(state.openings[this.#direction]), dispatchEvent)
  }

  #onUpdate (stepAdded, stepsDeleted) {
    const step = this.getStep()

    console.log(step, stepAdded)
    if (step?.isFinal()) {
      // Stop processing
      this.done = true
    }
console.log(this.done)
    emitEvent(Beam.Events.Update, { beam: this, state: step?.state, stepAdded, stepsDeleted })
  }

  #updateHistory (stepIndex) {
    const lastStepIndex = this.lastStepIndex()
    const lastStep = this.#steps[lastStepIndex]
    const step = this.#steps[stepIndex]

    console.debug(this.toString(), 'updateHistory', 'stepIndex: ' + stepIndex, 'lastStepIndex: ' + lastStepIndex)

    if (step) {
      // Remove now invalid path items
      this.path.splice(step.pathIndex).forEach((item) => item.remove())

      // Remove any now invalid segments from the now current path item
      const lastPathIndex = this.path.length - 1
      if (lastPathIndex >= 0) {
        this.path[lastPathIndex].removeSegments(step.segmentIndex)
      }

      const deletedSteps = this.#steps.splice(stepIndex)

      console.debug(this.toString(), 'removed steps: ', deletedSteps)

      // Remove beam from tiles it is being removed from
      const tiles = [...new Set(deletedSteps.map((step) => step.tile))]
      tiles.forEach((tile) => tile.removeItem(this))

      // Handle any state changes from the previous last step
      lastStep.onRemove()

      this.done = false
      this.#stepIndex = (stepIndex - 1)

      this.#onUpdate(undefined, deletedSteps)
    }

    return step
  }

  #getCollisions (items, segments, puzzle) {
    const path = new Path({ segments })
    const { 0: firstPoint, [segments.length - 1]: lastPoint } = segments
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
        points.sort(sortByDistance(firstPoint))

        if (puzzle.debug) {
          puzzle.drawDebugPoint(firstPoint)
          points.forEach((point) => puzzle.drawDebugPoint(point, { fillColor: 'black' }))
        }

        return { item, points }
      })
      .filter((result) => result.points.length)
      .sort((a, b) => {
        const sortOrder = a.item.sortOrder - b.item.sortOrder
        // First sort by precedence as defined on the item
        if (sortOrder !== 0) {
          return sortOrder
        } else {
          // If they are the same, sort by distance of closest intersection point from target point
          // Note: sort() mutates, so we need to create copies of these arrays first
          const closestPointA = Array.from(a.points).sort(sortByDistance(lastPoint)).shift()
          const closestPointB = Array.from(b.points).sort(sortByDistance(lastPoint)).shift()
          return sortByDistance(lastPoint)(closestPointA, closestPointB)
        }
      })
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

export class BeamStep {
  color
  colors
  direction
  id = BeamStep.uniqueId++
  point
  pathIndex
  segmentIndex
  tile

  constructor (tile, colors, direction, point, pathIndex, segmentIndex, state = new BeamState()) {
    if (!(state instanceof BeamState)) {
      throw new Error('State must be instance of BeamState')
    }

    this.state = state

    this.colors = Array.isArray(colors) ? Array.from(colors) : [colors]
    if (this.colors.length) {
      this.color = chroma.average(this.colors).hex()
    }
    this.direction = direction
    this.point = point
    this.pathIndex = pathIndex
    this.segmentIndex = segmentIndex
    this.tile = tile
  }

  copy (settings) {
    return new BeamStep(
      settings.tile || this.tile,
      settings.colors || this.colors,
      settings.direction || this.direction,
      settings.point || this.point,
      settings.pathIndex || this.pathIndex,
      settings.segmentIndex || this.segmentIndex,
      settings.state
    )
  }

  equals (step) {
    return step && (this.id === step.id || deepEqual(this, step))
  }

  isFinal () {
    return this.state.isFinal
  }

  onAdd () {
    this.state.onAdd()
  }

  onRemove () {
    this.state.onRemove()
  }

  static uniqueId = 0
}

export class BeamStop extends BeamStep {
  constructor() {
    super(null, [], null, null, null, null)
  }
}
