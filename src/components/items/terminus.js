import chroma from 'chroma-js'
import { Path } from 'paper'
import { toggleable } from '../modifiers/toggle'
import { Item } from '../item'
import { rotatable } from '../modifiers/rotate'
import { emitEvent, getNextDirection, getOppositeDirection } from '../util'
import { Beam } from './beam'
import { movable } from '../modifiers/move'

export class Terminus extends movable(rotatable(toggleable(Item))) {
  sortOrder = 1

  #ui

  constructor (tile, state) {
    super(...arguments)

    let color = state.color

    const openings = state.openings.map((state, direction) =>
      state
        ? new Terminus.#Opening(
          state.color || color,
          direction,
          state.connected,
          state.on
        )
        : state
    ).filter((opening) => opening)

    if (color) {
      color = chroma(color).hex()
    } else {
      const colors = openings.map((opening) => opening.color)

      if (colors.length === 0) {
        throw new Error('Terminus has no color defined.')
      }

      color = chroma.average(colors).hex()
    }

    this.#ui = Terminus.ui(tile, color, openings)

    this.group.addChildren([this.#ui.terminus, ...this.#ui.openings])

    this.color = color
    this.openings = openings
    this.radius = this.#ui.radius

    // Needs to be last since it references 'this'
    this.beams = openings.map((opening) => new Beam(this, state.openings[opening.direction], opening))

    this.update()
  }

  getOpening (direction) {
    return this.openings.find((opening) => opening.direction === direction)
  }

  onMove () {
    this.beams.forEach((beam) => beam.remove())
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
    console.debug(this.toString(), 'collision', beam.toString())

    // Colliding with the starting terminus, ignore
    if (beam.parent === this && beam.startDirection() === nextStep.direction) {
      console.debug(beam.toString(), 'ignoring starting terminus collision')
      return
    }

    const directionFrom = getOppositeDirection(currentStep.direction)
    const opening = this.openings.find((opening) =>
      // Take rotation of terminus into account
      (opening.direction + this.rotation) % 6 === directionFrom)

    // Beam has connected to a valid opening
    if (opening && !opening.on && opening.color === nextStep.color) {
      const connection = { terminus: this, opening }
      console.debug(beam.toString(), 'terminus connection', connection)
      return Beam.Step.from(nextStep, { state: { connection } })
    }

    // Otherwise, treat this as a collision
    return collisionStep
  }

  onConnection (direction) {
    const opening = this.getOpening(direction)
    opening.connect()
    this.update()
    emitEvent(Terminus.Events.Connection, { terminus: this, opening })
  }

  onDisconnection (direction) {
    const opening = this.getOpening(direction)
    opening.disconnect()
    this.update()
    emitEvent(Terminus.Events.Disconnection, { terminus: this, opening })
  }

  onToggle () {
    this.updateState((state) => {
      this.openings.forEach((opening) => {
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

      const p1 = terminus.segments[direction].point
      const p2 = terminus.segments[getNextDirection(direction)].point

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
      this.color = Array.isArray(color) ? chroma.average(color).hex() : color
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

  static Paths = Object.freeze({
    openings: 'openings',
    on: 'on'
  })
}
