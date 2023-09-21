import { Toggleable } from './modifiers/toggleable'
import { Locked } from './modifiers/locked'

export class Item {
  group

  constructor (tile, { type, modifiers }) {
    this.tile = tile
    this.type = type

    // This needs to be last because it references this
    this.modifiers = modifiers.map((configuration) => this.#modifierFactory(configuration))
  }

  // TODO:
  // handle display of and interaction with modifiers
  onClick (event, previouslySelectedTile) {
    console.log(event)
  }

  onDeselected () {
    this.modifiers.forEach((modifier) => modifier.detach())
  }

  onSelected () {
    this.modifiers.forEach((modifier) => modifier.attach())
  }

  update () {}

  #modifierFactory (configuration) {
    let modifier

    switch (configuration.type) {
      case Locked.Type:
        modifier = new Locked(this)
        break
      case Toggleable.Type:
        modifier = new Toggleable(this)
        break
      default:
        console.error('Ignoring modifier with unknown type: ' + configuration.type)
        break
    }

    return modifier
  }
}
