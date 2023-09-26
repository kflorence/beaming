import { Modifier } from '../modifier'

/**
 * Items with the Lock modifier cannot have their modifiers modified.
 * Any modifiers already on the item can be interacted with, unlike with Immutable.
 */
export class Lock extends Modifier {
  immutable = true
  name = 'lock'
  title = 'The items in this tile are locked. They can be updated but they cannot be modified.'

  static Type = 'Lock'
}
