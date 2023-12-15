import paper, { Point, Size } from 'paper'
import { Puzzle } from './components/puzzle'
import { addClass, debounce, removeClass } from './components/util'
import { StateManager } from './components/stateManager'
import { Puzzles } from './puzzles'

let puzzle

const elements = Object.freeze({
  dialog: document.getElementById('dialog'),
  info: document.getElementById('info'),
  main: document.getElementById('main'),
  message: document.getElementById('message'),
  next: document.getElementById('next'),
  previous: document.getElementById('previous'),
  puzzle: document.getElementById('puzzle'),
  puzzleId: document.getElementById('puzzle-id'),
  redo: document.getElementById('redo'),
  reset: document.getElementById('reset'),
  undo: document.getElementById('undo')
})

const Events = Object.freeze({
  Error: 'puzzle-error'
})

const stateManager = new StateManager()

document.addEventListener(Puzzle.Events.Solved, () => {
  document.body.classList.add(Puzzle.Events.Solved)
})

elements.info.addEventListener('click', () => {
  if (!elements.dialog.open) {
    elements.dialog.showModal()
  }
})

elements.next.addEventListener('click', () => {
  const id = Puzzles.nextId(stateManager.getId())
  if (id) {
    selectPuzzle(id)
  }
})

elements.previous.addEventListener('click', () => {
  const id = Puzzles.previousId(stateManager.getId())
  if (id) {
    selectPuzzle(id)
  }
})

elements.reset.addEventListener('click', () => {
  stateManager.resetState()
  selectPuzzle(stateManager.getId())
})

// Generate puzzle ID dropdown
for (const id of Puzzles.ids) {
  const option = document.createElement('option')
  option.value = id
  option.innerText = Puzzles.titles[id]
  elements.puzzleId.append(option)
}

elements.puzzleId.addEventListener('change', (event) => {
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

function selectPuzzle (id) {
  document.body.classList.remove(Events.Error)

  removeClass('disabled', ...Array.from(document.querySelectorAll('#actions li')))

  // TODO implement these
  addClass('disabled', elements.redo, elements.undo)

  if (puzzle) {
    puzzle.teardown()
  }

  try {
    const state = stateManager.setState(id)
    id = state.getId()

    if (!Puzzles.has(id)) {
      // Custom puzzle
      const option = document.createElement('option')
      option.value = id
      option.innerText = [stateManager.getTitle(), '(User-defined)'].join(' ')
      elements.puzzleId.prepend(option)
      elements.puzzleId.value = id
      addClass('disabled', elements.previous, elements.next)
    } else {
      elements.puzzleId.value = id

      if (id === Puzzles.firstId) {
        addClass('disabled', elements.previous)
      } else if (id === Puzzles.lastId) {
        addClass('disabled', elements.next)
      }
    }

    // TODO Puzzle should be a singleton that internally handles updating state
    puzzle = new Puzzle(stateManager)
  } catch (e) {
    console.error(e)
    elements.message.textContent = 'Invalid puzzle.'
    document.body.classList.add(Events.Error)
  }
}

// Initiate
// Don't automatically insert items into the scene graph, they must be explicitly inserted
paper.settings.insertItems = false

// noinspection JSCheckFunctionSignatures
paper.setup(elements.puzzle)
selectPuzzle()

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
window.puzzle = puzzle
window.puzzles = Puzzles
window.stateManager = stateManager
