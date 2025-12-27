import { Modifier } from '../modifier.js'
import { Icons } from '../icon.js'

export class StickyItems extends Modifier {
  title = 'Sticky Items'

  getIcon () {
    return Icons.StickyItems
  }

  static Schema = Object.freeze(Modifier.schema(Modifier.Types.StickyItems))
}

export class StickyModifiers extends Modifier {
  title = 'Sticky Modifiers'

  getIcon () {
    return Icons.StickyModifiers
  }

  static Schema = Object.freeze(Modifier.schema(Modifier.Types.StickyModifiers))
}
