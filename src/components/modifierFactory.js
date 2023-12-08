import { Immutable } from './modifiers/immutable'
import { Lock } from './modifiers/lock'
import { Move } from './modifiers/move'
import { Rotate } from './modifiers/rotate'
import { Toggle } from './modifiers/toggle'
import { Modifier } from './modifier'

export function modifierFactory (tile, configuration) {
  let modifier

  switch (configuration.type) {
    case Modifier.Types.immutable:
      modifier = new Immutable(tile, configuration)
      break
    case Modifier.Types.lock:
      modifier = new Lock(tile, configuration)
      break
    case Modifier.Types.move:
      modifier = new Move(tile, configuration)
      break
    case Modifier.Types.rotate:
      modifier = new Rotate(tile, configuration)
      break
    case Modifier.Types.toggle:
      modifier = new Toggle(tile, configuration)
      break
    default:
      console.error('Ignoring modifier with unknown type: ' + configuration.type)
      break
  }

  return modifier
}
