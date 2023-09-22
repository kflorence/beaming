import { Modifier } from '../modifier'

export class Immutable extends Modifier {
  immutable = true
  name = 'block'
  title = 'This item cannot be interacted with.'
}
