import chroma from 'chroma-js'
import { CompoundPath, Path, Point } from 'paper'
import { Item } from '../item'
import { deepEqual, emitEvent, fuzzyEquals, getConvertedDirection, sortByDistance } from '../util'

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

    console.debug(this.toString(), 'added step', this.#stepIndex, step)

    this.#onUpdate(step)
  }

  getColor () {
    return this.getState()?.color || this.#opening.color
  }

  getCollision () {
    return this.getState()?.collision
  }

  getCompoundPath () {
    return new CompoundPath({ children: this.path.map((item) => item.clone({ insert: false })) })
  }

  getConnection () {
    return this.getState()?.connection
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

  getMergedInto () {
    return this.getState()?.mergedInto
  }

  getState () {
    return this.getLastStep()?.state
  }

  getSteps (tile) {
    return tile ? this.#steps.filter((step) => step.tile === tile) : this.#steps
  }

  isComplete () {
    return this.isOn() && this.done
  }

  isConnected () {
    // Consider beams which have merged into connected beams to also be connected
    return this.getConnection() || this.getMergedInto()?.getConnection()
  }

  isOn () {
    // The opening will also be on if another beam connects with it
    return this.#opening.on && !this.#opening.connected
  }

  isPending () {
    return this.isOn() && !this.done
  }

  length () {
    return this.#steps.length
  }

  onBeamUpdated (event) {
    if (!this.isComplete()) {
      return
    }

    console.debug(this.toString(), 'onBeamUpdated', event)

    const beam = event.detail.beam
    const state = this.getState()
    if (!beam.isPending() && state?.collision?.item.equals(beam)) {
      const otherState = beam.getState()
      if (!state.collision.point.equals(otherState?.collision?.point)) {
        console.debug(this.toString(), 're-evaluating collision with beam', beam.toString())
        this.done = false
        this.#stepIndex = Math.min(this.#stepIndex - 1, 0)
      }
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
    console.debug(this.toString(), 'onCollision', beam.toString())

    if (!beam.isPending()) {
      console.debug(this.toString(), 'ignoring collision with inactive beam', beam.toString())
      return
    }

    if (this.getMergedInto() === beam) {
      console.debug(this.toString(), 'ignoring collision with merged beam', beam.toString())
      return
    }

    const lastStepIndex = this.#steps.length - 1
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

    // The beams are traveling in different directions, it's a collision
    if (step.direction !== nextStep.direction) {
      console.debug(this.toString(), 'collision with beam', beam.id)

      if (!step.state.collision) {
        // Merge collision into step state
        Object.assign(step.state, Beam.getCollisionState(collision, beam))

        if (stepIndex === lastStepIndex) {
          // If the matched step is the last step, no need to update history
          this.#onUpdate(step)
        } else {
          this.#updateHistory(stepIndex)
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
    console.debug(this.toString(), 'merging with beam', beam.id)

    // Merge the color from the other beam into this one
    step.color = chroma.average([step.color, beam.getColor()]).hex()

    if (!step.state.mergedWith) {
      step.state.mergedWith = [beam]
    } else {
      step.state.mergedWith.push(beam)
    }

    this.#updateHistory(stepIndex)
    this.addStep(step)

    return Beam.Step.from(nextStep, { state: { mergedInto: this } })
  }

  onModifierInvoked (event) {
    console.debug(this.toString(), 'onModifierInvoked', event)

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
    }
  }

  remove (stepIndex = 0) {
    this.#updateHistory(stepIndex)
  }

  startDirection () {
    // Take rotation of the parent (terminus) into account
    return (this.#opening.direction + this.parent.rotateDirection) % 6
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
      this.addStep(new Beam.Step(tile, this.#opening.color, this.startDirection(), tile.center, 0, 0))
    }

    const currentStep = this.#steps[this.#stepIndex]

    // On the first step, we have to take the rotation of the terminus into account
    const direction = this.#stepIndex === 0 ? this.startDirection() : currentStep.direction
    const nextPoint = Beam.getNextPoint(currentStep.point, currentStep.tile.parameters.inradius, direction)
    const tile = puzzle.getTile(nextPoint)

    // The next step would be off the grid
    if (!tile) {
      console.debug(this.toString(), 'stopping due to out of bounds')
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

    const items = tile.items.concat(currentStep.tile.equals(nextStep.tile) ? [] : currentStep.tile.items)

    console.debug(this.toString(), 'collision items:', items)

    // See if there are any collisions along the path we plan to take
    const collisions = this.#getCollisions(items, [currentStep.point, nextStep.point], puzzle)

    console.debug(this.toString(), 'collisions:', collisions)

    let collisionStep
    for (let collisionIndex = 0; collisionIndex < collisions.length; collisionIndex++) {
      const collision = collisions[collisionIndex]

      console.debug(this.toString(), 'resolving collision:', collision)

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
        existingNextStep,
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
    return `[${this.getColor()}:${this.id}]`
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
    const mergedInto = step.state.mergedInto
    this.done = true
    emitEvent(Beam.Events.Merge, { beam: this, mergedInto, step })
  }

  #onOutOfBounds (step) {
    this.done = true
    emitEvent(Beam.Events.OutOfBounds, { beam: this, step })
  }

  #onUpdate (stepAdded, stepsDeleted) {
    if (stepAdded) {
      // There's probably a better way to do this...
      if (stepAdded.state.collision) {
        this.#onCollision(stepAdded)
      } else if (stepAdded.state.connection) {
        this.#onConnection(stepAdded)
      } else if (stepAdded.state.mergedInto) {
        this.#onMerge(stepAdded)
      } else if (stepAdded.state.outOfBounds) {
        this.#onOutOfBounds(stepAdded)
      }
    }

    emitEvent(Beam.Events.Update, { beam: this, stepAdded, stepsDeleted })
  }

  #updateHistory (stepIndex) {
    const lastStepIndex = this.#steps.length - 1
    const lastStep = this.#steps[lastStepIndex]
    const step = this.#steps[stepIndex]

    console.debug(this.toString(), 'updateState', 'new: ' + stepIndex, 'old: ' + lastStepIndex)

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
      const connection = lastStep.state.connection
      if (connection) {
        connection.terminus.onDisconnection(connection.opening.direction)
      }

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

  static getCollisionState (collision, item) {
    item = item || collision.item
    const point = collision.points[0]
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
