import { Modifier } from '../modifier'

export class Immutable extends Modifier {
  immutable = true
  name = 'block'
  title = 'Immutable'

  static Schema = Object.freeze(Modifier.schema(Modifier.Types.immutable))
}
