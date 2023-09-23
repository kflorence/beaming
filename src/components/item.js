import { Toggle } from './modifiers/toggle'
import { Lock } from './modifiers/lock'
import { Rotate } from './modifiers/rotate'
import { Immutable } from './modifiers/immutable'

export class Item {
  center
  group
  tile

  constructor (tile, { type, modifiers }) {
    this.center = tile.center
    this.tile = tile
    this.type = type

    // This needs to be last because it references this
    this.modifiers = modifiers.map((configuration) => this.#modifierFactory(configuration))
  }

  onClick () {}

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
      case Immutable.Type:
        modifier = new Immutable(this, Immutable.Type)
        break
      case Lock.Type:
        modifier = new Lock(this, Lock.Type)
        break
      case Rotate.Type:
        modifier = new Rotate(this, Rotate.Type)
        break
      case Toggle.Type:
        modifier = new Toggle(this, Toggle.Type)
        break
      default:
        console.error('Ignoring modifier with unknown type: ' + configuration.type)
        break
    }

    return modifier
  }
}
