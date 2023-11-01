import { Modifier } from '../modifier'
import { Puzzle } from '../puzzle'
import { emitEvent } from '../util'

export class Move extends Modifier {
  name = 'drag_pan'
  title = 'Items in this tile can be moved to an empty tile.'
  type = Modifier.Types.move

  constructor () {
    super(...arguments)

    this.items = this.tile.items.filter((item) => item.movable === true)
  }

  onClick (event) {
    super.onClick(event)

    this.tile.onModifierSelected()

    const mask = new Puzzle.Mask(
      (tile) => {
        // Can be moved to any tile with no items in it
        // TODO: should we instead just check for collisions with existing items in tile?
        // That would allow wall pieces to be moved, for example.
        return tile.items.length > 0 && !(tile === this.tile)
      },
      this.#maskOnClick.bind(this)
    )

    emitEvent(Puzzle.Events.Mask, { mask })
  }

  #maskOnClick (puzzle, tile) {
    this.tile.onModifierDeselected()

    if (tile) {
      const items = this.items.filter((item) => item.movable)
      items.forEach((item) => item.move(tile))

      // Clear mask before dispatching event, since it could result in a solution
      puzzle.unmask()

      this.dispatchEvent(Modifier.Events.Invoked, { items })
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

    tile.addItem(this)
  }
}
