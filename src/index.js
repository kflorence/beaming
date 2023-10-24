import paper, { Size } from 'paper'
import { Puzzle } from './components/puzzle'
import puzzles from './puzzles'
import { debounce } from './components/util'

const history = window.history
const location = window.location

const elements = Object.freeze({
  main: document.getElementById('main'),
  message: document.getElementById('message'),
  puzzle: document.getElementById('puzzle'),
  reset: document.getElementById('reset')
})

const Events = Object.freeze({
  Error: 'puzzle-error'
})

// Handle puzzle solved
document.addEventListener(Puzzle.Events.Solved, () => {
  document.body.classList.add(Puzzle.Events.Solved)
})

// Handle puzzle reset
elements.reset.addEventListener('click', () => {
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

function resize () {
  const { width, height } = elements.main.getBoundingClientRect()
  elements.puzzle.style.height = height + 'px'
  elements.puzzle.style.width = width + 'px'

  if (paper.view?.viewSize) {
    paper.view.viewSize = new Size(width, height)
  }
}

// Handle canvas resize
window.addEventListener('resize', debounce(resize))
resize()

let puzzle
function selectPuzzle (id) {
  document.body.classList.remove(Events.Error)

  try {
    // Must be valid JSON
    const configuration = JSON.parse(JSON.stringify(puzzles[id]))

    if (puzzle) {
      puzzle.teardown()
    }

    window.puzzle = puzzle = new Puzzle(id, configuration)
    puzzleSelector.value = id

    // Store the puzzle selection in history
    const url = new URL(location)
    url.searchParams.set('id', id)
    history.pushState({ id }, '', url)
  } catch (e) {
    console.error(e)
    elements.message.textContent = 'Puzzle is invalid'
    document.body.classList.add(Events.Error)
  }
}

// Initiate
// Don't automatically insert items into the scene graph, they must be explicitly inserted
paper.settings.insertItems = false

// noinspection JSCheckFunctionSignatures
paper.setup(elements.puzzle)
const params = new URLSearchParams(window.location.search)
selectPuzzle(params.get('id') || '01')

// Prevent browser context menu on right click
document.body.addEventListener('contextmenu', (event) => {
  event.preventDefault()
  return false
})

window.drawDebugPoint = function (x, y) {
  return puzzle.drawDebugPoint(new paper.Point(x, y))
}
