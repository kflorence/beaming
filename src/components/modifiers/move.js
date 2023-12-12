import { Modifier } from '../modifier'
import { Puzzle } from '../puzzle'
import { emitEvent } from '../util'

export class Move extends Modifier {
  #mask

  name = 'drag_pan'
  title = 'Items in this tile can be moved to an empty tile.'

  onClick (event) {
    super.onClick(event)

    if (this.#mask) {
      return
    }

    this.tile.beforeModify()

    const mask = new Puzzle.Mask(this.tileFilter.bind(this), this.#maskOnClick.bind(this))

    this.#mask = mask

    emitEvent(Puzzle.Events.Mask, { mask })
  }

  moveItems (tile) {
    const items = this.tile.items.filter(Move.movable)
    items.forEach((item) => item.move(tile))
    return { moved: Move.data(this.tile, tile, items) }
  }

  tileFilter (tile) {
    // Filter out immutable tiles and tiles with items, except for the current tile
    return tile.modifiers.some(Modifier.immutable) || (tile.items.length > 0 && !(tile === this.tile))
  }

  #maskOnClick (puzzle, tile) {
    this.tile.afterModify()

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
