import { Modifier } from '../modifier.js'
import { Icons } from '../icon.js'
import { merge } from '../util.js'

export class PuzzleModifier extends Modifier {
  requiresItem = false
  title = 'Enter Puzzle'

  getIcon () {
    return Icons.Puzzle
  }

  getMessage () {
    return "You've unlocked a new puzzle!"
  }

  onTap (event) {
    super.onTap(event)

    // TODO handle tap
    // - if the puzzle ID points to an imported puzzle, center on the anchor tile
    // - load the puzzle
    // - will need to put some indication that we came from another puzzle, probably in the URL, so we can go back
  }

  static Schema = Object.freeze(merge([
    Modifier.schema(Modifier.Types.Puzzle),
    {
      properties: {
        puzzleId: {
          type: 'string'
        }
      },
      required: ['puzzleId']
    }
  ]))
}
