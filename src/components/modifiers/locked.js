import { Modifier } from '../modifier'

/**
 * Items with the Locked modifier cannot have their modifiers modified.
 * Any modifiers already on the item can be interacted with, unlike with Immutable.
 */
export class Locked extends Modifier {
  immutable = true
  name = 'lock'
  title = 'Locked'

  static Type = 'Locked'
}
