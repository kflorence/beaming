import paper, { Point, Size } from 'paper'
import { Puzzle } from './components/puzzle'
import { addClass, debounce, params, removeClass } from './components/util'
import { Puzzles } from './puzzles'
import { OffsetCoordinates } from './components/coordinates/offset'

const beaming = window.beaming = {}
const console = window.console = window.console || { debug: function () {} }

const consoleDebug = console.debug
beaming.debug = function (debug) {
  console.debug = debug ? consoleDebug : function () {}
}

// Silence debug logging by default since it can affect performance
beaming.debug(params.has('debug') ?? false)

// Feedback module
const doorbellOptions = window.doorbellOptions

const elements = Object.freeze({
  dialog: document.getElementById('dialog'),
  feedback: document.getElementById('feedback'),
  feedbackContainer: document.getElementById('feedback-container'),
  help: document.getElementById('help'),
  info: document.getElementById('info'),
  main: document.getElementById('main'),
  message: document.getElementById('message'),
  next: document.getElementById('next'),
  previous: document.getElementById('previous'),
  puzzle: document.getElementById('puzzle'),
  puzzleId: document.getElementById('puzzle-id'),
  redo: document.getElementById('redo'),
  reset: document.getElementById('reset'),
  title: document.querySelector('title'),
  undo: document.getElementById('undo')
})

const puzzle = beaming.puzzle = new Puzzle(elements.puzzle)

elements.feedback.addEventListener('click', () => {
  elements.help.setAttribute('open', 'true')
  elements.feedbackContainer.scrollIntoView(true)
})

elements.info.addEventListener('click', () => {
  if (!elements.dialog.open) {
    elements.dialog.showModal()
  }
})

elements.next.addEventListener('click', puzzle.next.bind(puzzle))
elements.previous.addEventListener('click', puzzle.previous.bind(puzzle))
elements.redo.addEventListener('click', puzzle.redo.bind(puzzle))
elements.reset.addEventListener('click', puzzle.reset.bind(puzzle))
elements.undo.addEventListener('click', puzzle.undo.bind(puzzle))

// Generate puzzle ID dropdown
for (const id of Puzzles.visible.ids) {
  const option = document.createElement('option')
  option.value = id
  option.innerText = Puzzles.titles[id]
  elements.puzzleId.append(option)
}

elements.puzzleId.addEventListener('change', (event) => puzzle.select(event.target.value))

document.addEventListener(Puzzle.Events.Updated, (event) => {
  const state = event.detail.state
  const id = state.getId()
  const title = state.getTitle()

  doorbellOptions.properties.puzzleId = id

  elements.title.textContent = `Beaming: Puzzle ${title}`

  removeClass('disabled', ...Array.from(document.querySelectorAll('#actions li')))

  const disable = []

  if (!state.canUndo()) {
    disable.push(elements.undo)
  }

  if (!state.canRedo()) {
    disable.push(elements.redo)
  }

  if (!Puzzles.visible.has(id)) {
    // Custom puzzle
    elements.puzzleId.value = ''
    disable.push(elements.previous, elements.next)
  } else {
    elements.puzzleId.value = id

    if (id === Puzzles.visible.firstId) {
      disable.push(elements.previous)
    } else if (id === Puzzles.visible.lastId) {
      disable.push(elements.next)
    }
  }

  addClass('disabled', ...disable)
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

// Prevent browser context menu on right click
document.body.addEventListener('contextmenu', (event) => {
  if (!elements.dialog.open) {
    event.preventDefault()
    return false
  }
})

// Initialize
puzzle.select()

// Used by functional tests
beaming.centerOnTile = function (r, c) {
  return puzzle.centerOnTile(new OffsetCoordinates(r, c))
}

// Useful for debug purposes
beaming.clearDebugPoints = puzzle.clearDebugPoints.bind(puzzle)
beaming.drawDebugPoint = function (x, y, style) {
  return puzzle.drawDebugPoint(new Point(x, y), style)
}
