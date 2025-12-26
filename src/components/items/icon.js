import { movable } from '../modifiers/move.js'
import { merge } from '../util.js'
import { Item } from '../item.js'
import { Icons } from '../icons.js'
import { Schema } from '../schema.js'

export class Icon extends movable(Item) {
  color
  id

  constructor (tile, state) {
    super(...arguments)

    this.color = state.color ?? Icon.DefaultColor
    this.id = ['icon', state.name].join('-')

    const data = { collidable: true }
    const style = { fillColor: this.color }

    this.symbol = Icons.ById[this.id]
    // Not using .place() here because SymbolItem doesn't allow updates and doesn't work with collisions
    // For some reason the imported SVGs have a Shape along with a Path item. We only need the Path item.
    this.item = this.symbol.getItem().children[1].clone({ insert: false }).set({
      data,
      position: tile.center,
      style,
      strokeScaling: false
    })

    // As imported, it is 24x24px
    this.item.scale(1.5)
    this.group.addChild(this.item)
  }

  onCollision ({ collisionStep, nextStep }) {
    if (this.color === Icon.DefaultColor || nextStep.color === this.color) {
      // Collided with an icon of matching color, or the default wildcard color
      return nextStep.copy({
        done: true,
        onAdd: () => {
          nextStep.onAdd()
          // TODO: 'collect' the modifier -- either place it on the tile or in the toolbar
          // Display a message to the user about the collection, depending on type
        }
      })
    }

    return collisionStep
  }

  static DefaultColor = '#333'

  static Names = Object.freeze({
    Puzzle: 'puzzle'
  })

  static Schema = Object.freeze(merge([
    Item.schema(Item.Types.icon),
    movable.Schema,
    {
      properties: {
        color: Schema.color,
        name: {
          enum: [Icon.Names.Puzzle],
          type: 'string'
        }
      },
      required: ['name']
    }
  ]))
}
