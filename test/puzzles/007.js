/* eslint-env mocha */
import { PuzzleFixture } from '../fixtures.js'
import assert from 'assert'

describe('Puzzle 007', function () {
  const puzzle = new PuzzleFixture('007')

  after(puzzle.after)
  before(puzzle.before)

  it('should be solved', async function () {
    await puzzle.solve([
      { type: 'tile-select', tile: '1,-1' },
      { type: 'modifier-invoke', modifier: 'move' },
      { type: 'tile-click', tile: '0,-2' },
      { type: 'tile-select', tile: '1,0' },
      { type: 'modifier-invoke', modifier: 'move' },
      { type: 'tile-click', tile: '0,2' },
      { type: 'tile-select', tile: '0,0' },
      { type: 'modifier-invoke', modifier: 'rotate' },
      { type: 'modifier-invoke', modifier: 'move' },
      { type: 'tile-click', tile: '0,1' }
    ])

    assert(await puzzle.isSolved())
  })
})
