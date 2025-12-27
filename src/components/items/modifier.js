import { Modifier } from '../modifier.js'
import { movable } from '../modifiers/move.js'
import { merge } from '../util.js'
import { Item } from '../item.js'
import { Schema } from '../schema.js'
import { Modifiers } from '../modifiers.js'

export class ModifierItem extends movable(Item) {
  color
  item
  modifier
  name

  constructor (tile, state) {
    super(...arguments)

    this.color = state.color ?? ModifierItem.DefaultColor
    this.name = state.name

    const data = { collidable: true }
    const style = { fillColor: this.color }

    // The modifier will attach to the tile if the item is sticky or if the tile has the StickyItems modifier
    const parent = (ModifierItem.Sticky.includes(this.name) ||
      tile.modifiers.some((modifier) => modifier.type === Modifier.Types.StickyItems))
      ? tile
      : null
    this.modifier = Modifiers.factory(parent, { type: state.name })

    // Not using .place() here because SymbolItem doesn't allow updates and doesn't work with collisions
    // For some reason the imported SVGs have a Shape along with a Path item. We only need the Path item.
    this.item = this.modifier.getIcon().symbol.getItem().children[1].clone({ insert: false })
    this.item.set({
      data,
      position: tile.center,
      style,
      strokeScaling: false
    })

    this.group.addChild(this.item)
  }

  onCollision ({ collisionStep, nextStep }) {
    if (this.color === ModifierItem.DefaultColor || nextStep.color === this.color) {
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

  static Schema = Object.freeze(merge([
    Item.schema(Item.Types.Modifier),
    movable.Schema,
    {
      properties: {
        color: Schema.color,
        name: {
          enum: [Modifier.Types.Puzzle],
          type: 'string'
        }
      },
      required: ['name']
    }
  ]))

  // These modifiers will always stick to the tile
  static Sticky = Object.freeze([Modifier.Types.Puzzle])
}
