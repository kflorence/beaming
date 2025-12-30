/* eslint-env mocha */
import { PuzzleFixture } from '../fixtures.js'
import assert from 'assert'

describe('Puzzle 006', function () {
  const puzzle = new PuzzleFixture('006')

  after(puzzle.after)
  before(puzzle.before)

  it('should be solved', async function () {
    await puzzle.solve([
      { type: 'tile-select', tile: '-1,-1' },
      { type: 'modifier-invoke', modifier: 'swap' },
      { type: 'tile-click', tile: '0,-1' },
      { type: 'tile-select', tile: '-1,-1' },
      { type: 'modifier-invoke', modifier: 'swap' },
      { type: 'tile-click', tile: '-1,0' },
      { type: 'tile-select', tile: '-1,-1' },
      { type: 'modifier-invoke', modifier: 'swap' },
      { type: 'tile-click', tile: '0,1' },
      { type: 'tile-select', tile: '-1,-1' },
      { type: 'modifier-invoke', modifier: 'swap' },
      { type: 'tile-click', tile: '1,-1' },
      { type: 'tile-select', tile: '-1,-1' },
      { type: 'modifier-invoke', modifier: 'swap' },
      { type: 'tile-click', tile: '0,-1' }
    ])

    assert(await puzzle.isSolved())
  })
})
