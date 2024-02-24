import chroma from 'chroma-js'
import { Path } from 'paper'
import { toggleable } from '../modifiers/toggle'
import { Item } from '../item'
import { rotatable } from '../modifiers/rotate'
import { getColorElements, emitEvent, getOppositeDirection, addDirection, subtractDirection } from '../util'
import { Beam } from './beam'
import { movable } from '../modifiers/move'
import { StepState } from '../step'

export class Terminus extends movable(rotatable(toggleable(Item))) {
  sortOrder = 2

  #ui

  constructor (tile, state) {
    super(...arguments)

    const colors = state.openings.filter((opening) => opening?.color)
      .flatMap((opening) => Array.isArray(opening.color) ? opening.color : [opening.color])
    const color = chroma.average(
      colors.length ? colors : (Array.isArray(state.color) ? state.color : [state.color])
    ).hex()

    const openings = state.openings.map((opening, direction) =>
      opening
        ? new Terminus.#Opening(
          opening.color ?? color,
          direction,
          opening.connected,
          opening.on ?? state.on
        )
        : opening
    ).filter((opening) => opening)

    this.#ui = Terminus.ui(tile, color, openings)

    this.group.addChildren([...this.#ui.openings, this.#ui.terminus])

    this.color = color
    this.openings = openings
    this.radius = this.#ui.radius

    // Needs to be last since it references 'this'
    this.beams = openings.map((opening) => new Beam(this, state.openings[opening.direction], opening))

    this.update()
  }

  getColorElements () {
    return getColorElements(this.openings.map((opening) => opening.color))
  }

  getOpening (direction) {
    return this.openings.find((opening) => opening.direction === direction)
  }

  onMove () {
    this.beams.forEach((beam) => beam.remove())
  }

  onCollision ({ beam, collisionStep, currentStep, existingNextStep, nextStep }) {
    console.debug(this.toString(), 'collision', beam.toString())

    // Colliding with the starting terminus, ignore
    if (beam.parent === this && beam.startDirection() === nextStep.direction) {
      console.debug(beam.toString(), 'ignoring starting terminus collision')
      return
    }

    const directionFrom = getOppositeDirection(currentStep.direction)

    // Take rotation of terminus into account
    const opening = this.openings.find((opening) => this.getDirection(opening.direction) === directionFrom)
    if (
      opening && opening.color === nextStep.color && (
        !opening.on ||
        // When re-evaluating history of an already connected opening
        (opening.connected && existingNextStep?.state.get(StepState.TerminusConnection)?.terminus.equals(this))
      )
    ) {
      // Beam has connected to a valid opening
      console.debug(beam.toString(), 'terminus connection', this.toString(), opening)
      return nextStep.copy({
        done: true,
        onAdd: () => {
          nextStep.onAdd()
          this.onConnection(opening.direction)
        },
        onRemove: () => {
          nextStep.onRemove()
          this.onDisconnection(opening.direction)
        },
        state: nextStep.state.copy(new StepState.TerminusConnection(this, opening))
      })
    }

    // Otherwise, treat this as a collision
    return collisionStep
  }

  onConnection (direction) {
    const opening = this.getOpening(direction)

    if (opening.connected) {
      // Already connected
      return
    }

    opening.connect()
    this.update()

    emitEvent(Terminus.Events.Connection, { terminus: this, opening })
  }

  onDisconnection (direction) {
    const opening = this.getOpening(direction)

    if (!opening.connected) {
      // Already disconnected
      return
    }

    opening.disconnect()
    this.update()

    emitEvent(Terminus.Events.Disconnection, { terminus: this, opening })
  }

  onToggle () {
    this.updateState((state) => {
      this.openings.filter((opening) => !opening.connected).forEach((opening) => {
        opening.toggle()
        state.openings[opening.direction].on = opening.on
      })
    })
    this.update()
  }

  update () {
    this.beams.forEach((beam) => {
      const opening = beam.getOpening()
      const item = this.#ui.openings.find((item) => item.data.direction === opening.direction)
      item.opacity = opening.on ? 1 : Terminus.#openingOffOpacity
    })
  }

  static #openingOffOpacity = 0.3

  static ui (tile, color, configuration) {
    const radius = tile.parameters.circumradius / 2

    const terminus = new Path.RegularPolygon({
      center: tile.center,
      fillColor: color,
      opacity: 1,
      sides: 6,
      radius: radius / 2
    })

    const openings = configuration.map((opening) => {
      const direction = opening.direction

      // Each opening is essentially a triangle from the mid-point segments of the terminus with the tip of the triangle
      // pointing in the direction of the opening. This ensures there isn't a gap between the opening triangle and the
      // terminus hexagon.
      const p1 = terminus.segments[subtractDirection(direction, 1)].point
      const p2 = terminus.segments[addDirection(direction, 2)].point

      const vector = p2.subtract(p1)

      vector.angle += 120

      const p3 = p1.subtract(vector)

      return new Path({
        closed: true,
        data: { collidable: false, direction },
        fillColor: opening.color,
        opacity: opening.on ? 1 : Terminus.#openingOffOpacity,
        segments: [p1, p2, p3]
      })
    })

    return { openings, radius, terminus }
  }

  static #Opening = class {
    constructor (color, direction, connected, on) {
      this.colors = Array.isArray(color) ? color : [color]
      this.color = chroma.average(this.colors).hex()
      this.direction = direction
      this.connected = connected === true
      this.on = on === true
    }

    connect () {
      this.connected = this.on = true
    }

    disconnect () {
      this.connected = this.on = false
    }

    toggle () {
      this.on = !this.on
    }
  }

  static Events = Object.freeze({
    Connection: 'terminus-connection',
    Disconnection: 'terminus-disconnection'
  })
}
