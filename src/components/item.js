import { Toggle } from './modifiers/toggle'

export class Item {
  group

  constructor (tile, { type, modifiers }) {
    this.tile = tile
    this.modifiers = modifiers.map((type) => this.#modifierFactory(type))
    this.type = type
  }

  // TODO:
  // handle display of and interaction with modifiers
  onClick (event, previouslySelectedTile) {
    console.log(event)
  }

  onDeselected () {
    // TODO: remove modifiers from DOM
  }

  onSelected () {
    // TODO: add modifiers to DOM
  }

  #modifierFactory (type) {
    let modifier

    switch (type) {
      case Toggle.Type:
        modifier = new Toggle()
        break
      default:
        console.error('Ignoring modifier with unknown type: ' + type)
        break
    }

    return modifier
  }
}
