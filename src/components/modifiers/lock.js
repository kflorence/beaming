import { Modifier } from '../modifier'

export class Lock extends Modifier {
  immutable = true
  name = 'lock'
  title = 'Locked'

  static Schema = Object.freeze(Modifier.schema(Modifier.Types.lock))
}
