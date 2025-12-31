import { Modifier } from '../modifier.js'
import { movable } from '../modifiers/move.js'
import { merge } from '../util.js'
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

  onCollision ({ collisionStep, nextStep, puzzle }) {
    if (this.color === ModifierItem.DefaultColor || nextStep.color === this.color) {
      // Collided with an icon of matching color, or the default wildcard color
      this.group.removeChildren()
      this.parent.removeItem(this)

      const state = this.getState()

      // The modifier will attach to the tile if the item is sticky or if the tile has the StickyItems modifier
      const parent = (ModifierItem.Sticky.includes(state.modifier.type) ||
        this.parent.modifiers.some((modifier) => modifier.type === Modifier.Types.StickyItems))
        ? this.parent
        : null

      const modifier = Modifiers.factory(parent, state.modifier)

      puzzle.addModifier(modifier)
      puzzle.setMessage(modifier.getMessage(this))

      return nextStep
    }

    return collisionStep
  }

  static DefaultColor = '#333'

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
