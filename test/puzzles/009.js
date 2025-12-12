/* eslint-env mocha */
import { PuzzleFixture } from '../fixtures.js'
import assert from 'assert'

describe('Puzzle 009', function () {
  const puzzle = new PuzzleFixture('009')

  after(puzzle.after)
  before(puzzle.before)

  it('should be solved', async function () {
    await puzzle.solve([
      { type: 'tile-select', tile: '0,2' },
      { type: 'modifier-invoke', modifier: 'Move' },
      { type: 'tile-click', tile: '1,2' },
      { type: 'tile-select', tile: '0,-2' },
      { type: 'modifier-invoke', modifier: 'Move' },
      { type: 'tile-click', tile: '-1,-3' },
      { type: 'tile-select', tile: '0,1' },
      { type: 'modifier-invoke', modifier: 'Move' },
      { type: 'tile-click', tile: '-1,2' }
    ])

    assert(await puzzle.isSolved())
  })
})
