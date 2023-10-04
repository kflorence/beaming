import { Item } from '../item'
import { Group, Path } from 'paper'
import { getNextDirection } from '../util'
import { rotatable } from '../modifiers/rotate'

export class Wall extends rotatable(Item) {
  #ui

  constructor (tile, configuration) {
    // noinspection JSCheckFunctionSignatures
    super(...arguments)

    this.#ui = Wall.ui(tile, configuration)

    this.group = this.#ui.group
  }

  static item (center, radius, cavityRadius, openings) {
    const hexagon = new Path.RegularPolygon({
      center,
      radius,
      sides: 6
    })

    const cavity = new Path.RegularPolygon({
      center,
      radius: radius - cavityRadius,
      sides: 6
    })

    const paths = openings.map((direction) => {
      return new Path({
        closed: true,
        segments: [
          center,
          hexagon.segments[direction].point,
          hexagon.segments[getNextDirection(direction)].point
        ]
      })
    })

    // Create the final shape
    return paths.reduce(
      (shape, path) => shape.subtract(path),
      hexagon.exclude(cavity)
    )
  }

  static ui (tile, { openings }) {
    const radius = tile.parameters.circumradius
    const item = Wall.item(tile.center, radius, radius / 6, openings)

    item.fillColor = tile.styles.default.strokeColor

    const group = new Group({
      children: [item],
      locked: true
    })

    return { item, group }
  }
}
