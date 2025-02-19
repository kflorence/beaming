import { Immutable } from './modifiers/immutable'
import { Lock } from './modifiers/lock'
import { Move } from './modifiers/move'
import { Rotate } from './modifiers/rotate'
import { Toggle } from './modifiers/toggle'
import { Modifier } from './modifier'
import { Swap } from './modifiers/swap'
import { Schema } from './schema'

export class Modifiers {
  static Schema = Object.freeze({
    $id: Schema.$id('modifiers'),
    items: {
      anyOf: [
        Immutable.Schema,
        Lock.Schema,
        Move.Schema,
        Rotate.Schema,
        Swap.Schema,
        Toggle.Schema
      ],
      headerTemplate: 'Modifier {{i1}}'
    },
    minItems: 0,
    maxItems: 6,
    type: 'array'
  })

  static factory (parent, state, index) {
    let modifier

    switch (state.type) {
      case Modifier.Types.immutable:
        modifier = new Immutable(...arguments)
        break
      case Modifier.Types.lock:
        modifier = new Lock(...arguments)
        break
      case Modifier.Types.move:
        modifier = new Move(...arguments)
        break
      case Modifier.Types.rotate:
        modifier = new Rotate(...arguments)
        break
      case Modifier.Types.swap:
        modifier = new Swap(...arguments)
        break
      case Modifier.Types.toggle:
        modifier = new Toggle(...arguments)
        break
      default:
        console.error(`Ignoring modifier with unknown type: ${state.type}`, state)
        break
    }

    return modifier
  }
}
