import { Modifier } from '../modifier'

export class Lock extends Modifier {
  immutable = true
  name = 'lock'
  title = 'Locked'
}
