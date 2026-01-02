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
    const ref = puzzle.getImport(state.puzzleId)

    // Set the parent of the puzzle we are entering to the current puzzle
    State.setParent(state.puzzleId, puzzle.state.getId())

    // Center the screen on the anchor point of the import
    puzzle.centerOn(ref.offset.r, ref.offset.c)

    // Load the import behind the current puzzle and then swap them
    puzzle.select(state.puzzleId, { animation: 'fade-out' })
  }

  static schema () {
    const currentId = State.getId()
    const ids = State.getIds().filter((id) => id !== currentId)
    const titles = ids.map((id) => State.fromCache(id)?.getTitle() ?? id)
    return Object.freeze(merge([
      Modifier.schema(Modifier.Types.Puzzle),
      {
        properties: {
          puzzleId: {
            enum: ids,
            options: {
              enum_titles: titles
            },
            type: 'string'
          }
        },
        required: ['puzzleId']
      }
    ]))
  }
}
