import { Modifier } from '../modifier.js'
import { Icons } from '../icon.js'

// TODO the functionality of this modifier has not been implemented yet
// It should cause Items to be stuck to a tile (e.g. cannot move them off the tile)
export class StickyItems extends Modifier {
  immutable = true
  title = 'Sticky Items'

  getIcon () {
    return Icons.StickyItems
  }

  static Schema = Object.freeze(Modifier.schema(Modifier.Types.StickyItems))
}

export class StickyModifiers extends Modifier {
  immutable = true
  title = 'Sticky Modifiers'

  getIcon () {
    return Icons.StickyModifiers
  }

  static Schema = Object.freeze(Modifier.schema(Modifier.Types.StickyModifiers))
}
