import { Modifier } from '../modifier.js'
import { Icons } from '../icon.js'
import { merge, params } from '../util.js'
import { Puzzle } from '../puzzle.js'
import { Puzzles } from '../../puzzles/index.js'
import { State } from '../state.js'
import { Game } from '../game.js'

export class PuzzleModifier extends Modifier {
  requiresItem = false
  title = 'Enter Puzzle'

  getIcon () {
    return Icons.Puzzle
  }

  onCollect ({ puzzle }) {
    const state = this.getState()

    puzzle.headerMessages.add(`You've unlocked puzzle '${state.id}'!`)
    puzzle.layout.unlock(state.id)

    Game.updatePuzzles([State.ContextKeys.Play])
  }

  async onInvoked (puzzle) {
    const state = this.getState()

    // Track parent(s)
    const id = puzzle.state.getId()
    const parent = params.get(State.CacheKeys.Parent)
    params.set(State.CacheKeys.Parent, parent ? [parent, id].join(',') : id)

    // Load the import behind the current puzzle and then swap them
    await puzzle.select(state.id, { animations: [Puzzle.Animations.SlideLeft] })
  }

  static schema () {
    const imports = Puzzles.imports()
    return Object.freeze(merge([
      Modifier.schema(Modifier.Types.Puzzle),
      {
        properties: {
          id: {
            enum: imports.ids,
            options: {
              enum_titles: imports.titles
            },
            type: 'string'
          }
        },
        required: ['id']
      }
    ]))
  }
}
