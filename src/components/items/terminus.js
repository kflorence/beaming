import chroma from 'chroma-js'
import { Group, Path } from 'paper'
import { toggleable } from '../modifiers/toggle'
import { Item } from '../item'
import { rotatable } from '../modifiers/rotate'
import { getCentroid, getNextDirection } from '../util'
import { Beam } from './beam'

export class Terminus extends rotatable(toggleable(Item)) {
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
        opening.direction = direction
        opening.on = !!opening.on
      }
    })

    if (color === undefined) {
      const colors = openings.filter((opening) => opening?.color).map((opening) => opening.color)

      if (colors.length === 0) {
        throw new Error('Terminus has no color defined.')
      }

      color = chroma.average(colors).hex()
    }

    this.#ui = Terminus.ui(tile, { color, openings })

    this.color = color
    this.group = this.#ui.group
    this.openings = openings
    this.radius = this.#ui.radius

    // Needs to be last since it references 'this'
    this.beams = openings.filter((opening) => opening).map((opening) => new Beam(this, opening))

    this.update()
  }

  onConnection (direction) {
    this.openings[direction].on = true
    this.update()
  }

  onDisconnection (direction) {
    this.openings[direction].on = false
    this.update()
  }

  onToggle () {
    this.openings.filter((opening) => opening).forEach((opening) => opening.on = !opening.on)
    this.update()
  }

  update () {
    this.beams.forEach((beam) => {
      this.#ui.openings[beam.direction].opacity = this.openings[beam.direction].on ? 1 : Terminus.#openingOffOpacity
      beam.update()
    })
  }

  static #openingOffOpacity = 0.3

  static ui (tile, { color, openings: configuration }) {
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
        fillColor: opening.color,
        opacity: opening.on ? 1 : Terminus.#openingOffOpacity,
        segments: [p1, p2, p3]
      })
    })

    const group = new Group({
      children: [terminus, ...openings.filter((opening) => opening)],
      locked: true
    })

    return { group, openings, radius, terminus }
  }
}