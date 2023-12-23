import { Move } from './move'
import { Modifier } from '../modifier'
import { Item } from '../item'

export class Swap extends Move {
  name = 'swap_horiz'
  title = 'Items in this tile can be swapped for items in another tile.'

  moveItems (tile) {
    const toItems = tile.items.filter(Move.movable)
    const fromItems = this.tile.items.filter(Move.movable)

    fromItems.forEach((item) => item.move(tile))
    toItems.forEach((item) => item.move(this.tile))

    return {
      moved: [Move.data(this.tile, tile, fromItems), Move.data(tile, this.tile, toItems)]
    }
  }

  tileFilter (tile) {
    // Filter out immutable tiles and tiles without items
    return tile.modifiers.some(Modifier.immutable) || !tile.items.filter((item) => item.type !== Item.Types.beam).length
  }
}
