import paper from 'paper'
import { Puzzle } from './components/puzzle'
import puzzles from './puzzles'
import { Events, Messages } from './components/util'

const message = document.getElementById('message')
const reset = document.getElementById('reset')

// Handle puzzle reset
reset.addEventListener('click', () => {
  if (document.body.classList.contains(Events.Solved)) {
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
    message.textContent = Messages.TileUnselected
    puzzleSelector.value = id
    puzzle = new Puzzle(configuration)
  } else {
    message.textContent = Messages.ErrorInvalidId
    document.body.classList.add(Events.Error)
  }
}

// Initiate
// noinspection JSCheckFunctionSignatures
paper.setup(document.getElementById('puzzle'))
const params = new URLSearchParams(window.location.search)
selectPuzzle(params.get('id') || '01')

// Prevent browser context menu on right click
document.body.addEventListener('contextmenu', (event) => {
  event.preventDefault()
  return false
})

// Handle puzzle being solved
document.addEventListener(Events.Solved, () => {
  document.body.classList.remove(Events.TileSelected)
  document.body.classList.add(Events.Solved)
})

// Handle tile being selected
document.addEventListener(Events.TileSelected, (event) => {
  const tile = event.detail.selected
  message.textContent = tile ? tile.coordinates.offset.toString() : Messages.TileUnselected
  document.body.classList[tile ? 'add' : 'remove'](Events.TileSelected)
})
