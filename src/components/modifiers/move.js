import { Modifier } from '../modifier'
import { Puzzle } from '../puzzle'
import { emitEvent } from '../util'
import { Icons } from '../icon.js'

export class Move extends Modifier {
  #mask

  title = 'Move'

  attach (tile) {
    super.attach(tile)
    this.update({ disabled: !tile.items.some(Move.movable) })
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
    // Never mask current tile
    return !tile.equals(this.tile) && !tile.items.some(Move.movable)
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

  static Schema = Object.freeze(Modifier.schema(Modifier.Types.Move))
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
}

movable.Schema = {
  properties: {
    movable: {
      default: true,
      type: 'boolean'
    }
  }
}
