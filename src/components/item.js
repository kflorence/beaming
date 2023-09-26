export class Item {
  center
  group
  tile

  constructor (tile, { type }) {
    this.center = tile.center
    this.tile = tile
    this.type = type
  }

  onClick () {}

  onDeselected () { }

  onSelected () {}

  update () {}
}
