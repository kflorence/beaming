import { Modifier } from '../modifier.js'
import { movable } from '../modifiers/move.js'
import { emitEvent, merge } from '../util.js'
import { Item } from '../item.js'
import { Modifiers } from '../modifiers.js'
import { PuzzleModifier } from '../modifiers/puzzle.js'

export class ModifierItem extends movable(Item) {
  color
  item
  name

  constructor (tile, state) {
    super(...arguments)

    this.color = state.color ?? ModifierItem.DefaultColor
    this.name = state.name

    const data = { collidable: true }
    const style = { fillColor: this.color }

    // Get a throwaway instance of the modifier so we can get the correct icon for it
    const icon = Modifiers.factory(null, state.modifier).getIcon()

    // Not using .place() here because SymbolItem doesn't allow updates and doesn't work with collisions
    // For some reason the imported SVGs have a Shape along with a Path item. We only need the Path item.
    this.item = icon.symbol.getItem().children[1].clone({ insert: false })
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
        onAdd: () => {
          nextStep.onAdd()

          this.group.removeChildren()
          this.parent.removeItem(this)

          const state = this.getState()

          // The modifier will attach to the tile if the item is sticky or if the tile has the StickyItems modifier
          const parent = (ModifierItem.Sticky.includes(state.modifier.type) ||
            this.parent.modifiers.some((modifier) => modifier.type === Modifier.Types.StickyItems))
            ? this.parent
            : null

          const modifier = Modifiers.factory(parent, state.modifier)
          const message = modifier.getMessage(this)

          emitEvent(ModifierItem.Events.AddModifier, { item: this, message, modifier })
        },
        onRemove: () => {
          nextStep.onRemove()
          this.parent.addItem(this)
          this.group.addChild(this.item)
        }
      })
    }

    return collisionStep
  }

  static DefaultColor = '#333'

  static Events = Object.freeze({
    AddModifier: 'modifier-item-add'
  })

  static schema = () => Object.freeze(merge([
    Item.schema(Item.Types.Modifier),
    movable.schema(),
    {
      properties: {
        modifier: {
          oneOf: [
            PuzzleModifier.schema()
          ],
          type: 'object'
        }
      },
      required: ['modifier']
    }
  ]))

  // These modifiers will always stick to the tile
  static Sticky = Object.freeze([Modifier.Types.Puzzle])
}
