import paper from 'paper'
import { Puzzle } from './components/puzzle'
import puzzles from './puzzles'
import { Messages } from './components/util'
import { Beam } from './components/items/beam'
import { Modifier } from './components/modifier'

const history = window.history
const location = window.location

const message = document.getElementById('message')
const reset = document.getElementById('reset')

const Events = Object.freeze({
  Error: 'puzzle-error'
})

// Handle puzzle reset
reset.addEventListener('click', () => {
  if (document.body.classList.contains(Puzzle.Events.Solved)) {
    selectPuzzle(puzzleSelector.value)
  }
})

// Handle puzzle selector dropdown
const puzzleSelector = document.getElementById('puzzle-selector')
for (const id of Object.keys(puzzles)) {
  const option = document.createElement('option')
  option.value = id
  option.innerText = id
  puzzleSelector.appendChild(option)
}

puzzleSelector.addEventListener('change', (event) => {
  selectPuzzle(event.target.value)
})

let puzzle
function selectPuzzle (id) {
  const configuration = puzzles[id]

  document.body.classList.remove(...Object.values(Events))

  if (puzzle) {
    paper.project.clear()
  }

  if (configuration) {
    const url = new URL(location)
    url.searchParams.set('id', id)
    history.pushState({ id }, '', url)

    puzzleSelector.value = id
    puzzle = new Puzzle(id, configuration)
  } else {
    message.textContent = Messages.ErrorInvalidId
    document.body.classList.add(Events.Error)
  }
}

// Initiate
// Don't automatically insert items into the scene graph, they must be explicitly inserted
paper.settings.insertItems = false

// noinspection JSCheckFunctionSignatures
paper.setup(document.getElementById('puzzle'))
const params = new URLSearchParams(window.location.search)
selectPuzzle(params.get('id') || '01')

// Prevent browser context menu on right click
document.body.addEventListener('contextmenu', (event) => {
  event.preventDefault()
  return false
})

document.addEventListener(Beam.Events.Connection, (event) => puzzle.onBeamConnected(event))
document.addEventListener(Beam.Events.Collision, (event) => puzzle.onBeamCollision(event))
document.addEventListener(Modifier.Events.Deselected, () => puzzle.unmask())
document.addEventListener(Modifier.Events.Invoked, (event) => puzzle.onModifierInvoked(event))
document.addEventListener(Modifier.Events.Selected, (event) => puzzle.mask(event))
document.addEventListener(Puzzle.Events.Solved, () => {
  document.body.classList.add(Puzzle.Events.Solved)
})
