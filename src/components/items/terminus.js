import chroma from 'chroma-js'
import { Group, Path } from 'paper'
import { toggleable } from '../modifiers/toggle'
import { Item } from '../item'
import { rotatable } from '../modifiers/rotate'
import { emitEvent, getNextDirection, getOppositeDirection } from '../util'
import { Beam } from './beam'
import { movable } from '../modifiers/move'

export class Terminus extends movable(rotatable(toggleable(Item))) {
  rotateDegrees = 60
  type = Item.Types.terminus

  #ui

  constructor (tile, { color, openings, type, modifiers }) {
    // noinspection JSCheckFunctionSignatures
    super(...arguments)

    // Normalize openings data
    openings.forEach((opening, direction) => {
      if (opening) {
        opening.color = opening.color || color
        if (Array.isArray(opening.color)) {
          opening.color = chroma.average(opening.color).hex()
        }
        opening.connected = false
        opening.direction = direction
        opening.on = !!opening.on
      }
    })

    if (color) {
      color = chroma(color).hex()
    } else {
      const colors = openings.filter((opening) => opening?.color).map((opening) => opening.color)

      if (colors.length === 0) {
        throw new Error('Terminus has no color defined.')
      }

      color = chroma.average(colors).hex()
    }

    const data = { id: this.id, type: this.type }
    this.#ui = Terminus.ui(tile, { color, openings, data })

    this.color = color
    this.group = this.#ui.group
    this.openings = openings
    this.radius = this.#ui.radius

    // Needs to be last since it references 'this'
    this.beams = openings.filter((opening) => opening).map((opening) => new Beam(this, opening))

    this.update()
  }

  onMove () {
    this.beams.forEach((beam) => beam.remove())
  }

  onCollision (beam, puzzle, collision, collisionIndex, collisions, currentStep, nextStep, collisionStep) {
    // Colliding with the starting terminus on the first step, ignore
    if (beam.parent === this && currentStep.segmentIndex === 0) {
      console.debug(beam.id, 'ignoring starting terminus collision')
      return
    }

    const opening = this.openings[getOppositeDirection(currentStep.direction)]

    // Beam has connected to a valid opening
    if (opening && !opening.on && opening.color === nextStep.color) {
      const connection = { terminus: this, opening }
      console.debug(beam.id, 'terminus connection', connection)
      return Beam.Step.from(nextStep, { state: { connection } })
    }

    // Otherwise, treat this as a collision
    return collisionStep
  }

  onConnection (direction) {
    const opening = this.openings[direction]
    opening.connected = opening.on = true
    this.update()
    emitEvent(Terminus.Events.Connection, { terminus: this, opening })
  }

  onDisconnection (direction) {
    const opening = this.openings[direction]
    opening.connected = opening.on = false
    this.update()
    emitEvent(Terminus.Events.Disconnection, { terminus: this, opening })
  }

  onToggle () {
    this.openings.filter((opening) => opening).forEach((opening) => {
      opening.on = !opening.on
    })
    this.update()
  }

  update () {
    this.beams.forEach((beam) => {
      this.#ui.openings[beam.direction].opacity = this.openings[beam.direction].on ? 1 : Terminus.#openingOffOpacity
    })
  }

  static #openingOffOpacity = 0.3

  static ui (tile, { color, openings: configuration, data }) {
    const radius = tile.parameters.circumradius / 2

    const terminus = new Path.RegularPolygon({
      center: tile.center,
      fillColor: color,
      opacity: 1,
      sides: 6,
      radius: radius / 2
    })

    const openings = configuration.map((opening) => {
      if (!opening) {
        return opening
      }

      const direction = opening.direction

      const p1 = terminus.segments[direction].point
      const p2 = terminus.segments[getNextDirection(direction)].point

      const vector = p2.subtract(p1)

      vector.angle += 120

      const p3 = p1.subtract(vector)

      return new Path({
        closed: true,
        data: { collidable: false },
        fillColor: opening.color,
        opacity: opening.on ? 1 : Terminus.#openingOffOpacity,
        segments: [p1, p2, p3]
      })
    })

    const group = new Group({
      children: [terminus, ...openings.filter((opening) => opening)],
      data,
      locked: true
    })

    return { group, openings, radius, terminus }
  }

  static Events = Object.freeze({
    Connection: 'terminus-connection',
    Disconnection: 'terminus-disconnection'
  })
}
