export class Item {
  group

  constructor (tile, { type, modifiers }) {
    this.tile = tile
    this.modifiers = modifiers
    this.type = type
  }

  // TODO:
  // handle display of and interaction with modifiers
  onClick (event) {
    console.log(event)
  }
}
