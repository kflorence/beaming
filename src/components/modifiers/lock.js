import { Modifier } from '../modifier'
import { Symbols } from '../symbols.js'

export class Lock extends Modifier {
  immutable = true
  title = 'Locked'

  getSymbol () {
    return Symbols.Lock
  }

  static Schema = Object.freeze(Modifier.schema(Modifier.Types.lock))
}
