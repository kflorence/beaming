import { Modifier } from '../modifier.js'
import { Icons } from '../icon.js'

export class PuzzleModifier extends Modifier {
  title = 'Puzzle'

  getIcon () {
    return Icons.Puzzle
  }

  static Schema = Object.freeze(Modifier.schema(Modifier.Types.Puzzle))
}
