import { movable } from '../modifiers/move.js'
import { merge } from '../util.js'
import { Item } from '../item.js'
import { Icons } from '../icons.js'

export class Icon extends movable(Item) {
  id

  constructor (tile, state) {
    super(...arguments)

    this.id = ['icon', state.name].join('-')

    const data = { collidable: true }
    const style = { fillColor: '#ccc', strokeColor: '#333' }

    this.symbol = Icons.ById[this.id]
    this.item = this.symbol.place(tile.center, { data, style, strokeScaling: false })
    this.item.scale(1.5)
    this.group.addChild(this.item)
  }

  onCollision ({ collisionStep }) {
    // TODO handle collision
    // - can handle differently depending on name
    // - by default, treat the icon as a modifier. in that case, the icon would be "collected" and added to the
    //   globally available modifiers
    // - the "puzzle entry" icon will be a special case. it should display a confirmation dialog which when accepted
    //   will take the user into the puzzle. on collision, the icon should be updated to be filled with the color of
    //   the beam that collided with it. the confirmation dialog should not appear if the collision happens when the
    //   puzzle is loaded, only if the user collides with the icon at any point after that.
    return collisionStep
  }

  static Schema = Object.freeze(merge([
    Item.schema(Item.Types.icon),
    movable.Schema,
    {
      properties: {
        name: {
          type: 'string'
        }
      },
      required: ['name']
    }
  ]))
}
