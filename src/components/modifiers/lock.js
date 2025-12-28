import { Modifier } from '../modifier'
import { Icons } from '../icon.js'

// TODO the functionality for this modifier has not been implemented yet
// It should make a tile un-alterable (nothing can be added/removed), but whatever is already on it can be used
export class Lock extends Modifier {
  immutable = true
  title = 'Locked'

  getIcon () {
    return Icons.Lock
  }

  static Schema = Object.freeze(Modifier.schema(Modifier.Types.Lock))
}
