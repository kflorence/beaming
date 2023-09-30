import { Modifier } from '../modifier'

// TODO implement
export class Move extends Modifier {
  name = 'drag_pan'
  title = 'Items in this tile can be moved to an empty tile.'
  type = Modifier.Types.move
}
