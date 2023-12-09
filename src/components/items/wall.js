import { Item } from '../item'
import { Path } from 'paper'
import { getNextDirection } from '../util'
import { rotatable } from '../modifiers/rotate'
import { movable } from '../modifiers/move'

export class Wall extends movable(rotatable(Item)) {
  constructor (tile, state) {
    super(tile, state, { rotateDegrees: 30 })
    this.group.addChild(Wall.item(tile, state))
  }

  static item (tile, { openings }) {
    const center = tile.center
    const radius = tile.parameters.circumradius
    const cavityRadius = radius / 6
    const fillColor = tile.styles.default.strokeColor

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
        fillColor,
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
}
