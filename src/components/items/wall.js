import { Item } from '../item'
import { Path } from 'paper'
import { addDirection, merge } from '../util'
import { rotatable } from '../modifiers/rotate'
import { movable } from '../modifiers/move'
import { Schema } from '../schema'

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
      const firstSegment = tile.path.segments[direction].point
      const nextDirection = addDirection(direction, 1)
      const lastSegment = tile.path.segments[nextDirection].point

      return new Path({
        closed: true,
        fillColor,
        segments: [
          firstSegment,
          tile.path.getLocationAt(
            (direction === 0 ? tile.path.length : tile.path.getOffsetOf(firstSegment)) - width
          ),
          tile.path.getLocationAt(
            (nextDirection === 0 ? 0 : tile.path.getOffsetOf(lastSegment)) + width
          ),
          lastSegment
        ]
      })
    })
  }

  static Schema = Object.freeze(merge([
    Item.schema(Item.Types.wall),
    {
      properties: {
        immutable: {
          default: true,
          type: 'boolean'
        }
      }
    },
    movable.Schema,
    rotatable.Schema,
    {
      properties: {
        directions: {
          items: Schema.direction,
          minItems: 1,
          maxItems: 6,
          type: 'array',
          uniqueItems: true
        }
      },
      required: ['directions']
    }
  ]))
}
