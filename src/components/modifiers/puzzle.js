import { Modifier } from '../modifier.js'
import { Icons } from '../icon.js'
import { merge } from '../util.js'
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

    const p = document.createElement('p')
    p.textContent = `You've unlocked puzzle ${Puzzles.getTitle(state.id)}!`

    const span = document.createElement('span')
    span.classList.add('action')
    span.textContent = 'Enter Puzzle'

    span.addEventListener('click', () => this.onTap())

    puzzle.headerMessages.set([p, span])

    puzzle.layout.unlock(state.id)
    puzzle.updateState()
    puzzle.updateModifiers()

    Game.updatePuzzles([State.ContextKeys.Play])
  }

  async onInvoked (puzzle) {
    const state = this.getState()

    // Track parent(s)
    State.setParentId(puzzle.state.getId())

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
