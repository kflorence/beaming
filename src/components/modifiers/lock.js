import { Modifier } from '../modifier'
import { Icons } from '../icon.js'

export class Lock extends Modifier {
  immutable = true
  title = 'Locked'

  getIcon () {
    return Icons.Lock
  }

  static Schema = Object.freeze(Modifier.schema(Modifier.Types.Lock))
}
