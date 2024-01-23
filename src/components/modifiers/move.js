import { Modifier } from '../modifier'
import { Puzzle } from '../puzzle'
import { emitEvent } from '../util'
import { Item } from '../item'

export class Move extends Modifier {
  #mask

  name = 'drag_pan'
  title = 'Move'

  onTap (event) {
    super.onTap(event)

    const items = this.tile.items.filter(Move.movable)
    if (this.#mask || !items.length) {
      return
    }

    this.tile.beforeModify()

    const mask = new Puzzle.Mask(this.tileFilter.bind(this), {
      onTap: this.#maskOnTap.bind(this),
      onUnmask: () => this.tile.afterModify()
    })

    this.#mask = mask

    emitEvent(Puzzle.Events.Mask, { mask })
  }

  moveFilter (tile) {
    // Filter out tiles that contain no movable items
    return super.moveFilter(tile) || !tile.items.some((item) => item.movable)
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
    // Filter out immutable tiles and tiles with items, except for the current tile
    return tile.modifiers.some(Modifier.immutable) ||
      (tile.items.filter((item) => item.type !== Item.Types.beam).length > 0 && !(tile === this.tile))
  }

  #maskOnTap (puzzle, tile) {
    if (tile) {
      const data = this.moveItems(tile)

      puzzle.updateState()
      puzzle.updateSelectedTile(tile)
      puzzle.unmask()

      this.dispatchEvent(Modifier.Events.Invoked, data)
    } else {
      puzzle.unmask()
    }

    this.#mask = undefined
  }

  static data (fromTile, toTile, items) {
    return { fromTile, toTile, items }
  }

  static movable (item) {
    return item.movable
  }
}

/**
 * Move an item from one tile to another.
 * @param SuperClass
 * @returns {{new(*, *): MovableItem, movable: boolean, prototype: MovableItem}}
 */
export const movable = (SuperClass) => class MovableItem extends SuperClass {
  movable

  constructor (parent, configuration) {
    super(...arguments)

    this.movable = configuration.movable !== false
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
