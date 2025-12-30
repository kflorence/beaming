import { Modifier } from '../modifier.js'
import { Icons } from '../icon.js'
import { merge } from '../util.js'
import { State } from '../state.js'

export class PuzzleModifier extends Modifier {
  requiresItem = false
  title = 'Enter Puzzle'

  getIcon () {
    return Icons.Puzzle
  }

  getMessage () {
    return "You've unlocked a new puzzle!"
  }

  onInvoked (puzzle) {
    const state = this.getState()

    // Set the parent of the puzzle we are entering to the current puzzle
    State.setParent(state.puzzleId, puzzle.state.getId())

    puzzle.centerOnImport(state.puzzleId)

    // Slight pause so the user can see the tile being centered on
    setTimeout(() => {
      puzzle.select(state.puzzleId)
      puzzle.centerOnTile(0, 0)
    }, 250)
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
