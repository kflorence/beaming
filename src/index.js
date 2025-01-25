import './dialog'
import { debug } from './components/debug'
import paper, { Point } from 'paper'
import { Puzzle } from './components/puzzle'
import { OffsetCoordinates } from './components/coordinates/offset'

if (process.env.NODE_ENV === 'production') {
  require('./analytics')
  require('./feedback')
}

const puzzle = new Puzzle()
const beaming = { debug, puzzle }

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
