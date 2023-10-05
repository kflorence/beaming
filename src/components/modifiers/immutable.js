import { Modifier } from '../modifier'

export class Immutable extends Modifier {
  immutable = true
  name = 'block'
  title = 'The items in this tile are immutable. They cannot be updated or modified.'
  type = Modifier.Types.immutable
}