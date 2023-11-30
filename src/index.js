import paper, { Point, Size } from 'paper'
import { Puzzle } from './components/puzzle'
import puzzles from './puzzles'
import { debounce } from './components/util'

let center, puzzle

const history = window.history
const location = window.location

const elements = Object.freeze({
  main: document.getElementById('main'),
  message: document.getElementById('message'),
  next: document.getElementById('next'),
  previous: document.getElementById('previous'),
  puzzle: document.getElementById('puzzle'),
  redo: document.getElementById('redo'),
  reset: document.getElementById('reset'),
  undo: document.getElementById('undo')
})

const Events = Object.freeze({
  Error: 'puzzle-error'
})

const puzzleIds = Object.keys(puzzles)
const lastPuzzleIndex = puzzleIds.length - 1

// Handle puzzle solved
document.addEventListener(Puzzle.Events.Solved, () => {
  document.body.classList.add(Puzzle.Events.Solved)
})

// Handle menu items
elements.next.addEventListener('click', () => {
  const index = puzzleIds.findIndex((id) => id === puzzleSelector.value)
  if (index < lastPuzzleIndex) {
    selectPuzzle(puzzleIds[index + 1])
  }
})

elements.previous.addEventListener('click', () => {
  const index = puzzleIds.findIndex((id) => id === puzzleSelector.value)
  if (index > 0) {
    selectPuzzle(puzzleIds[index - 1])
  }
})

elements.reset.addEventListener('click', () => {
  selectPuzzle(puzzleSelector.value)
})

// Handle puzzle selector dropdown
const puzzleSelector = document.getElementById('puzzle-selector')
for (const id of puzzleIds) {
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
    center = paper.view.center
  }
}

// Handle canvas resize
window.addEventListener('resize', debounce(resize))
resize()

function selectPuzzle (id) {
  document.body.classList.remove(Events.Error)

  const actions = Array.from(document.querySelectorAll('#actions li'))
  actions.forEach((element) => element.classList.remove('disabled'))

  // TODO implement
  elements.redo.classList.add('disabled')
  elements.undo.classList.add('disabled')

  if (id === puzzleIds[0]) {
    elements.previous.classList.add('disabled')
  } else if (id === puzzleIds[puzzleIds.length - 1]) {
    elements.next.classList.add('disabled')
  }

  try {
    // Must be valid JSON
    const configuration = JSON.parse(JSON.stringify(puzzles[id]))

    if (puzzle) {
      puzzle.teardown()

      // Reset any changes from zoom/drag
      paper.view.zoom = 1
      paper.view.center = center
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
center = paper.view.center
const params = new URLSearchParams(window.location.search)
selectPuzzle(params.get('id') || '01')

// Handle zoom
elements.puzzle.addEventListener('wheel', (event) => {
  event.preventDefault()

  const zoom = paper.view.zoom * (event.deltaY > 0 ? 0.95 : 1.05)

  // Don't allow zooming too far in or out
  if (zoom > 2 || zoom < 0.5) {
    return
  }

  // Convert the mouse point from the view coordinate space to the project coordinate space
  const mousePoint = paper.view.viewToProject(new Point(event.offsetX, event.offsetY))
  const mouseOffset = mousePoint.subtract(paper.view.center)

  // Adjust center towards cursor location
  const zoomOffset = mousePoint
    .subtract(mouseOffset.multiply(paper.view.zoom / zoom))
    .subtract(paper.view.center)

  paper.view.zoom = zoom
  paper.view.center = paper.view.center.add(zoomOffset)
}, { passive: false })

// Prevent browser context menu on right click
document.body.addEventListener('contextmenu', (event) => {
  event.preventDefault()
  return false
})

window.drawDebugPoint = function (x, y, style) {
  return puzzle.drawDebugPoint(new paper.Point(x, y), style)
}

window.paper = paper
