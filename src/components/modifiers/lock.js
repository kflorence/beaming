import { Modifier } from '../modifier'

/**
 * Items with the Lock modifier cannot have their modifiers modified.
 * Any modifiers already on the item can be interacted with, unlike with Immutable.
 */
export class Lock extends Modifier {
  immutable = true
  name = 'lock'
  title = 'This item cannot be modified.'

  static Type = 'Lock'
}
