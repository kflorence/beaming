import { Move } from './move'
import { Modifier } from '../modifier'

export class Swap extends Move {
  name = 'swap_horiz'
  title = 'Swap'

  moveItems (tile) {
    const toItems = tile.items.filter(Move.movable)
    const fromItems = this.tile.items.filter(Move.movable)

    fromItems.forEach((item) => item.move(tile))
    toItems.forEach((item) => item.move(this.tile))

    return {
      moved: [Move.data(this.tile, tile, fromItems), Move.data(tile, this.tile, toItems)],
      tiles: [this.tile, tile]
    }
  }

  tileFilter (tile) {
    // Never mask current tile
    return !tile.equals(this.tile) && (
      // Mask immutable tiles
      tile.modifiers.some(Modifier.immutable) ||
      // Mask tiles that don't contain any movable items
      !tile.items.some(Move.movable)
    )
  }
}
