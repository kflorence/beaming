import { Modifier } from '../modifier'
import { Puzzle } from '../puzzle'
import { emitEvent } from '../util'
import { Item } from '../item'
import { Icons } from '../icons'

export class Move extends Modifier {
  #mask

  name = Icons.Move.name
  title = 'Move'

  onTap (event) {
    super.onTap(event)

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

  moveFilter (tile) {
    // Filter out tiles that contain no movable items
    return super.moveFilter(tile) || !tile.items.some(Move.movable)
  }

  moveItems (tile) {
    const items = this.tile.items.filter(Move.movable)
    items.forEach((item) => item.move(tile))
    return {
      moved: [Move.data(this.tile, tile, items)],
      tiles: [this.tile, tile]
    }
  }

  tileFilter (tile) {
    // Never mask current tile
    return !tile.equals(this.tile) && (
      // Mask immutable tiles
      tile.modifiers.some(Modifier.immutable) ||
      // Mask tiles that contain any items we don't ignore
      tile.items.some((item) => !Move.ignoreItemTypes.includes(item.type))
    )
  }

  #maskOnTap (puzzle, tile) {
    puzzle.unmask()

    if (tile) {
      const data = this.moveItems(tile)

      puzzle.updateSelectedTile(tile)

      this.dispatchEvent(Modifier.Events.Invoked, data)
    }

    this.#mask = undefined
  }

  static data (fromTile, toTile, items) {
    return { fromTile, toTile, items }
  }

  static movable (item) {
    return item.movable
  }

  static ignoreItemTypes = [Item.Types.beam, Item.Types.wall]
}

/**
 * Move an item from one tile to another.
 * @param SuperClass
 * @returns {{new(*, *): MovableItem, movable: boolean, prototype: MovableItem}}
 */
export const movable = (SuperClass) => class MovableItem extends SuperClass {
  movable

  constructor (parent, state) {
    super(...arguments)
    this.movable = !this.immutable && state.movable !== false
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
}
