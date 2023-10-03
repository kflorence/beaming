import chroma from 'chroma-js'
import { Group, Path } from 'paper'
import { toggleable } from '../modifiers/toggle'
import { Item } from '../item'
import { rotatable } from '../modifiers/rotate'
import { getCentroid, getNextDirection } from '../util'

export class Terminus extends rotatable(toggleable(Item)) {
  rotateDegrees = 60
  type = Item.Types.terminus

  #ui

  constructor (tile, { color, openings, type, modifiers }) {
    // noinspection JSCheckFunctionSignatures
    super(...arguments)

    // Normalize openings data
    openings.filter((opening) => opening).forEach((opening) => {
      opening.color = opening.color || color
      opening.on = !!opening.on
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

    this.update()
  }

  onToggle () {
    this.openings.filter((opening) => opening).forEach((opening) => {
      opening.on = !opening.on
    })
  }

  static ui (tile, { color, openings: configuration }) {
    const radius = tile.parameters.circumradius / 2

    const bounds = new Path.RegularPolygon({
      insert: false,
      center: tile.center,
      sides: 6,
      radius
    })

    const terminus = new Path.RegularPolygon({
      center: tile.center,
      fillColor: color,
      insert: false,
      opacity: 0.25,
      sides: 6,
      radius: radius / 2
    })

    const openings = configuration
      .flatMap((opening, direction) => opening ? [{ direction, ...opening }] : [])
      .map((opening) => {
        const direction = opening.direction

        const triangle = new Path({
          closed: true,
          fillColor: opening.color,
          insert: false,
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
          insert: false,
          segments: [p1, p2, p3]
        })

        return triangle.subtract(cutout, { insert: false })
      })

    const group = new Group({
      children: [terminus, ...openings],
      locked: true
    })

    return { group, openings, radius, terminus }
  }
}
