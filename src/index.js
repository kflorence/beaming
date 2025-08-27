import './dialog'
import { debug } from './components/debug'
import paper, { Point } from 'paper'
import { Puzzle } from './components/puzzle'
import { OffsetCoordinates } from './components/coordinates/offset'
import { base64decode, params } from './components/util'

if (process.env.NODE_ENV === 'production') {
  require('./analytics')
}

const puzzle = new Puzzle()
const beaming = { debug, puzzle }

const states = ['edit', 'play']
if (states.some((state) => params.has(state))) {
  document.getElementById('dialog-title').close()
}

// Used by functional tests
beaming.centerOnTile = function (r, c) {
  return puzzle.centerOnTile(new OffsetCoordinates(r, c))
}

beaming.clearDebugPoints = puzzle.clearDebugPoints.bind(puzzle)
beaming.drawDebugPoint = function (x, y, style) {
  return puzzle.drawDebugPoint(new Point(x, y), style)
}

// Export
window.beaming = beaming
window.paper = paper
window.util = { base64decode }
