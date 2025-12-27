import { Modifier } from '../modifier'
import { Symbols } from '../symbols.js'

export class Immutable extends Modifier {
  immutable = true
  title = 'Immutable'

  getSymbol () {
    return Symbols.Immutable
  }

  static Schema = Object.freeze(Modifier.schema(Modifier.Types.immutable))
}
