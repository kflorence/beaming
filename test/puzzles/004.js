/* eslint-env mocha */
import { PuzzleFixture } from '../fixtures.js'
import assert from 'assert'

describe('Puzzle 004', function () {
  const puzzle = new PuzzleFixture('004')

  after(puzzle.after)
  before(puzzle.before)

  it('should be solved', async function () {
    await puzzle.solve([
      { type: 'tile-select', tile: '-1,-1' },
      { type: 'modifier-invoke', modifier: 'rotate', options: { times: 3 } },
      { type: 'tile-select', tile: '1,-1' },
      { type: 'modifier-invoke', modifier: 'swap' },
      { type: 'tile-click', tile: '-1,-1' }
    ])

    assert(await puzzle.isSolved())
  })
})
