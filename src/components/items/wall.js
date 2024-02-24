import { Item } from '../item'
import { Path } from 'paper'
import { addDirection } from '../util'
import { rotatable } from '../modifiers/rotate'
import { movable } from '../modifiers/move'

export class Wall extends movable(rotatable(Item)) {
  sortOrder = 1

  constructor (tile, state) {
    // Exclude from modification by default
    state.immutable ??= true

    super(tile, state, { rotationDegrees: 60 })

    const walls = Wall.item(tile, state)
    this.group.addChildren(walls)
  }

  static item (tile, configuration) {
    const radius = tile.parameters.circumradius
    const width = radius / 12
    const fillColor = tile.styles.default.strokeColor

    return configuration.directions.map((direction) => {
      const firstSegment = tile.hexagon.segments[direction].point
      const nextDirection = addDirection(direction, 1)
      const lastSegment = tile.hexagon.segments[nextDirection].point

      return new Path({
        closed: true,
        fillColor,
        segments: [
          firstSegment,
          tile.hexagon.getLocationAt(
            (direction === 0 ? tile.hexagon.length : tile.hexagon.getOffsetOf(firstSegment)) - width
          ),
          tile.hexagon.getLocationAt(
            (nextDirection === 0 ? 0 : tile.hexagon.getOffsetOf(lastSegment)) + width
          ),
          lastSegment
        ]
      })
    })
  }
}
