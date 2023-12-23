import { Modifier } from '../modifier'

export class Lock extends Modifier {
  immutable = true
  name = 'lock'
  title = 'The items in this tile are locked.'
}
