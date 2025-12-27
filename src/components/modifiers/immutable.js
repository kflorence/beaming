import { Modifier } from '../modifier'
import { Icons } from '../icon.js'

export class Immutable extends Modifier {
  immutable = true
  title = 'Immutable'

  getIcon () {
    return Icons.Immutable
  }

  static Schema = Object.freeze(Modifier.schema(Modifier.Types.Immutable))
}
