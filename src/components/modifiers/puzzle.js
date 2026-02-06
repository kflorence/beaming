import { Modifier } from '../modifier.js'
import { Icons } from '../icon.js'
import { merge } from '../util.js'
import { State } from '../state.js'
import { Puzzle } from '../puzzle.js'
import { Puzzles } from '../../puzzles/index.js'
import { View } from '../view.js'

export class PuzzleModifier extends Modifier {
  requiresItem = false
  title = 'Enter Puzzle'

  getIcon () {
    return Icons.Puzzle
  }

  onCollect ({ puzzle }) {
    const state = this.getState()

    puzzle.headerMessages.add(`You've unlocked puzzle '${state.puzzleId}'!`)
    puzzle.layout.unlock(state.puzzleId)
  }

  async onInvoked (puzzle) {
    const state = this.getState()
    const ref = puzzle.layout.getImport(state.puzzleId)

    // Set the parent of the puzzle we are entering to the current puzzle
    State.setParent(state.puzzleId, puzzle.state.getId())

    // Center the screen on the anchor point of the import
    View.setZoom(1)
    puzzle.centerOn(ref.offset.r, ref.offset.c)

    // Load the import behind the current puzzle and then swap them
    await puzzle.select(state.puzzleId, { animations: [Puzzle.Animations.FadeIn, Puzzle.Animations.FadeOutAfter] })
  }

  static schema () {
    const imports = Puzzles.imports()
    return Object.freeze(merge([
      Modifier.schema(Modifier.Types.Puzzle),
      {
        properties: {
          puzzleId: {
            enum: imports.ids,
            options: {
              enum_titles: imports.titles
            },
            type: 'string'
          }
        },
        required: ['puzzleId']
      }
    ]))
  }
}
