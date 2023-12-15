import paper, { Point, Size } from 'paper'
import { Puzzle } from './components/puzzle'
import { addClass, debounce, removeClass } from './components/util'
import { Puzzles } from './puzzles'

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

const puzzle = new Puzzle(elements.puzzle)

document.addEventListener(Puzzle.Events.Solved, () => {
  document.body.classList.add(Puzzle.Events.Solved)
})

elements.info.addEventListener('click', () => {
  if (!elements.dialog.open) {
    elements.dialog.showModal()
  }
})

elements.next.addEventListener('click', puzzle.next.bind(puzzle))
elements.previous.addEventListener('click', puzzle.previous.bind(puzzle))
elements.reset.addEventListener('click', puzzle.reset.bind(puzzle))

// Generate puzzle ID dropdown
for (const id of Puzzles.ids) {
  const option = document.createElement('option')
  option.value = id
  option.innerText = Puzzles.titles[id]
  elements.puzzleId.append(option)
}

elements.puzzleId.addEventListener('change', (event) => puzzle.select(event.target.value))

document.addEventListener(Puzzle.Events.Selected, (event) => {
  const state = event.detail.state
  const id = state.getId()

  removeClass('disabled', ...Array.from(document.querySelectorAll('#actions li')))

  // TODO implement these
  addClass('disabled', elements.redo, elements.undo)

  if (!Puzzles.has(id)) {
    // Custom puzzle
    elements.puzzleId.value = ''
    addClass('disabled', elements.previous, elements.next)
  } else {
    elements.puzzleId.value = id

    if (id === Puzzles.firstId) {
      addClass('disabled', elements.previous)
    } else if (id === Puzzles.lastId) {
      addClass('disabled', elements.next)
    }
  }
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

// Initialize
puzzle.select()

window.paper = paper
window.puzzle = puzzle
window.puzzles = Puzzles
