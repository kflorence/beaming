import { Modifier } from '../modifier'
import { Puzzle } from '../puzzle'
import { emitEvent } from '../util'
import { Icons } from '../icon.js'
import { Item } from '../item.js'

export class Move extends Modifier {
  #mask

  title = 'Move'

  attach (tile) {
    super.attach(tile)
    if (!this.disabled) {
      this.update({ disabled: !tile?.items.some(Move.movable) })
    }
  }

  getIcon () {
    return Icons.Move
  }

  moveItems (tile) {
    const items = this.tile.items.filter(Move.movable)
    items.forEach((item) => item.move(tile))
    return {
      moved: [Move.data(this.tile, tile, items)],
      selectedTile: tile,
      tile: this.tile,
      tiles: [this.tile, tile]
    }
  }

  onTap (event) {
    const items = this.tile.items.filter(Move.movable)
    if (this.#mask || !items.length) {
      return
    }

    const mask = new Puzzle.Mask({
      id: this.toString(),
      onTap: this.#maskOnTap.bind(this),
      onMask: () => this.tile.beforeModify(),
      onUnmask: () => this.tile.afterModify(),
      tileFilter: this.tileFilter.bind(this)
    })

    this.#mask = mask

    emitEvent(Puzzle.Events.Mask, { mask })
  }

  tileFilter (tile) {
    // Don't mask the current tile
    return !tile.equals(this.tile) && (
      // Mask tiles that contain modifiers which make moving items to that tile invalid
      tile.modifiers.some((modifier) => Move.InvalidModifierTypes.includes(modifier.type)) ||
      // Tile is already occupied by an item
      tile.items.some((item) => !Move.ExcludeItemTypes.includes(item.type))
    )
  }

  #maskOnTap (puzzle, tile) {
    puzzle.unmask()

    if (tile) {
      const data = this.moveItems(tile)
      this.dispatchEvent(Modifier.Events.Invoked, data)
    }

    this.#mask = undefined
  }

  static data (fromTile, toTile, items) {
    return { fromTile, toTile, items }
  }

  static movable (item) {
    return item.isMovable()
  }

  // A tile with these items will not prevent moving items to that tile
  static ExcludeItemTypes = [Item.Types.Beam, Item.Types.Wall]

  // A tile with these modifiers will prevent moving items to that tile
  static InvalidModifierTypes = [Modifier.Types.Immutable, Modifier.Types.Lock]

  static schema = () => Object.freeze(Modifier.schema(Modifier.Types.Move))
}

/**
 * Move an item from one tile to another.
 * @param SuperClass
 * @returns {{new(*, *): MovableItem, prototype: MovableItem}}
 */
export const movable = (SuperClass) => class MovableItem extends SuperClass {
  #movable

  constructor (tile, state) {
    super(...arguments)
    this.#movable = state.movable ?? true
  }

  isMovable () {
    return this.#movable && !this.isStuck()
  }

  move (tile) {
    this.parent.removeItem(this)

    // Update the position of the item group based on the vector of the tile we are moving to
    const vector = this.parent.center.subtract(tile.center)
    this.group.position = this.group.position.subtract(vector)

    // Update tile reference
    this.parent = tile
    this.parent.addItem(this)
    this.center = this.parent.center

    this.onMove()
  }

  onMove () {}

  static schema () {
    return {
      properties: {
        movable: {
          default: true,
          type: 'boolean'
        }
      }
    }
  }
}
