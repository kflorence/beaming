import { Modifier } from '../modifier'
import { Puzzle } from '../puzzle'
import { emitEvent } from '../util'

export class Move extends Modifier {
  name = 'drag_pan'
  title = 'Items in this tile can be moved to an empty tile.'
  type = Modifier.Types.move

  onClick (event) {
    super.onClick(event)

    this.tile.onModifierSelected()

    const mask = new Puzzle.Mask(
      // TODO: should we instead just check for collisions with existing items in tile?
      (tile) => {
        // Filter out tiles with items, except for the current tile
        return (tile.items.length > 0 && !(tile === this.tile)) ||
          // Filter out tiles with the immutable modifier
          tile.modifiers.some((modifier) => modifier.type === Modifier.Types.immutable)
      },
      this.#maskOnClick.bind(this)
    )

    emitEvent(Puzzle.Events.Mask, { mask })
  }

  #maskOnClick (puzzle, tile) {
    this.tile.onModifierDeselected()

    if (tile) {
      const items = this.tile.items.filter((item) => item.movable)
      items.forEach((item) => item.move(tile))

      // Clear mask before dispatching event, since it could result in a solution
      puzzle.unmask()

      this.dispatchEvent(Modifier.Events.Invoked, { items, destination: tile })
    } else {
      puzzle.unmask()
    }
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

    this.onMove()
  }

  onMove () {}
}
