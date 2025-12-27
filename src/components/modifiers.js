import { Immutable } from './modifiers/immutable'
import { Lock } from './modifiers/lock'
import { Move } from './modifiers/move'
import { Rotate } from './modifiers/rotate'
import { Toggle } from './modifiers/toggle'
import { Modifier } from './modifier'
import { Swap } from './modifiers/swap'
import { Schema } from './schema'
import { PuzzleModifier } from './modifiers/puzzle.js'

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
      headerTemplate: 'modifier {{i1}}'
    },
    minItems: 0,
    maxItems: 6,
    type: 'array'
  })

  static factory (parent, state, index) {
    switch (state.type) {
      case Modifier.Types.Immutable: {
        return new Immutable(...arguments)
      }
      case Modifier.Types.Lock: {
        return new Lock(...arguments)
      }
      case Modifier.Types.Move: {
        return new Move(...arguments)
      }
      case Modifier.Types.Puzzle: {
        return new PuzzleModifier(...arguments)
      }
      case Modifier.Types.Rotate: {
        return new Rotate(...arguments)
      }
      case Modifier.Types.Swap: {
        return new Swap(...arguments)
      }
      case Modifier.Types.Toggle: {
        return new Toggle(...arguments)
      }
      default: {
        console.error(`Ignoring modifier with unknown type: ${state.type}`, state)
      }
    }
  }
}
