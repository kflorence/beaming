import { Modifier } from '../modifier.js'
import { Icons } from '../icon.js'

export class StickyItems extends Modifier {
  immutable = true
  title = 'Sticky Items'

  getIcon () {
    return Icons.StickyItems
  }

  static schema = () => Object.freeze(Modifier.schema(Modifier.Types.StickyItems))
}

export class StickyModifiers extends Modifier {
  immutable = true
  title = 'Sticky Modifiers'

  getIcon () {
    return Icons.StickyModifiers
  }

  static schema = () => Object.freeze(Modifier.schema(Modifier.Types.StickyModifiers))
}
