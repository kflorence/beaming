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

  onToggle () {
    this.beams.forEach((beam) => beam.toggle())
  }

  static ui (tile, { color, openings: configuration }) {
    const radius = tile.parameters.circumradius / 2

    const bounds = new Path.RegularPolygon({
      center: tile.center,
      sides: 6,
      radius
    })

    const terminus = new Path.RegularPolygon({
      center: tile.center,
      fillColor: color,
      opacity: 0.25,
      sides: 6,
      radius: radius / 2
    })

    const openings = configuration.filter((opening) => opening).map((opening) => {
      const direction = opening.direction

      const triangle = new Path({
        closed: true,
        fillColor: opening.color,
        segments: [
          bounds.segments[direction].point,
          bounds.segments[getNextDirection(direction)].point,
          tile.center
        ]
      })

      const vector = triangle.lastSegment.point.subtract(triangle.firstSegment.point)

      const p1 = getCentroid(triangle)
      const p2 = p1.subtract(vector)

      vector.angle += 60

      const p3 = p1.subtract(vector)

      const cutout = new Path({
        closed: true,
        segments: [p1, p2, p3]
      })

      return triangle.subtract(cutout)
    })

    const group = new Group({
      children: [terminus, ...openings],
      locked: true
    })

    return { group, openings, radius, terminus }
  }
}
