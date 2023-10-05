import { CompoundPath, Group, Path, Point } from 'paper'
import { Item } from '../item'
import { emitEvent, getOppositeDirection } from '../util'

export class Beam extends Item {
  debug = false
  done = false

  #connection
  #opening
  #path
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
  step (layout) {
    if (!this.isActive()) {
      return
    }

    const previous = this.#steps[this.#steps.length - 1]
    const direction = previous ? previous.direction : this.#startDirection()
    const tile = previous ? layout.getNeighboringTile(previous.tile.coordinates.axial, direction) : this.parent.parent

    // There is no tile in the direction we are headed
    if (!tile) {
      console.log('beam is going off the grid')
      this.done = true
      this.#onCollision()
      return
    }

    const fromPoint = previous ? previous.lastPoint() : tile.center
    const length = previous ? tile.parameters.width : tile.parameters.inradius

    // Create a shadow path to see if we can move to the edge of the current tile
    const shadowPath = Beam.#shadowPath(fromPoint, length, direction)

    for (const intersection of Beam.#getIntersections(tile, shadowPath)) {
      const item = intersection.item

      if (this.debug) {
        console.log('intersection', intersection)
        intersection.intersections.forEach((curveLocation) => {
          const circle = new Path.Circle({ radius: 3, fillColor: 'red', center: curveLocation.point })
          layout.layers.debug.addChild(circle)
        })
      }

      if (item.type === Item.Types.terminus) {
        // Intersecting with the starting terminus
        if (!previous && item === this.parent) {
          console.log('starting terminus collision')
          continue
        }

        const opening = item.openings[getOppositeDirection(direction)]

        // Beam has connected to a matching opening!
        if (!opening.on && opening.color === this.color) {
          const lastIndex = shadowPath.segments.length - 1
          shadowPath.removeSegment(lastIndex)
          shadowPath.insert(lastIndex, tile.center)

          this.done = true
          this.#onConnection(item, opening)
        }
      }

      // Unhandled
      if (!this.done) {
        // Update end of path to end at first intersection
        const lastIndex = shadowPath.segments.length - 1
        shadowPath.removeSegment(lastIndex)
        shadowPath.insert(lastIndex, intersection.intersections[0].point)

        this.done = true
        this.#onCollision(intersection)
      }

      // Stopping on first intersection for now
      break
    }

    const segments = shadowPath.segments.map((segment) => segment.point)

    if (this.debug) {
      segments.forEach((segment) => {
        const circle = new Path.Circle({ radius: 3, fillColor: 'red', center: segment })
        layout.layers.debug.addChild(circle)
      })
    }

    this.#path.addSegments(shadowPath.segments)
    this.#steps.push(new Beam.#Step(tile, segments, direction, this.#path.segments.length - 1))
  }

  update () {
    // Handle 'off'. 'On' will be handled upstream in puzzle.
    if (!this.#opening.on) {
      this.#updateState(0)
    }
  }

  #onCollision (intersection) {
    emitEvent(Beam.Events.Collision, { beam: this, intersection })
  }

  #onConnection (terminus, opening) {
    this.#connection = { terminus, opening }
    terminus.onConnection(opening.direction)
    emitEvent(Beam.Events.Connection, { beam: this, terminus, opening })
  }

  #startDirection () {
    // Take rotation of the parent (terminus) into account
    return (this.#opening.direction + this.parent.rotateDirection) % 6
  }

  #updateState (stepIndex) {
    if (stepIndex < 0) {
      return
    }

    if (this.#connection) {
      this.#connection.terminus.onDisconnection(this.#connection.opening.direction)
      this.#connection = undefined
    }

    const step = this.#steps[stepIndex]
    if (step) {
      this.#path.removeSegments(step.index)
      this.#steps.splice(stepIndex)
    }

    this.done = false
  }

  static #getIntersections (tile, path) {
    return tile.items
      .map((item) => {
        const compoundPath = new CompoundPath({ children: item.group.clone().children })
        const intersections = path.getIntersections(compoundPath)
        return { item, intersections }
      })
      .filter((result) => result.intersections.length)
  }

  static #shadowPath (point, length, direction) {
    const vector = new Point(0, 0)
    vector.length = length
    // In PaperJS an angle of zero corresponds with the right hand side of the horizontal axis of a circle. The
    // direction we are given correspond with the segments of a hexagon, which start at an angle of 240 degrees.
    vector.angle = 240 + (60 * direction)
    return new Path({ segments: [point, point.add(vector)] })
  }

  static #Step = class {
    constructor (tile, segment, direction, index) {
      this.direction = direction
      this.index = index
      this.tile = tile
      this.segment = segment
    }

    lastPoint () {
      return this.segment[this.segment.length - 1]
    }
  }

  static Events = Object.freeze({
    Collision: 'beam-collision',
    Connection: 'beam-connection'
  })
}
