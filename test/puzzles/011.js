/* eslint-env mocha */
import { PuzzleFixture } from '../fixtures.js'
import assert from 'assert'

describe('Puzzle 011', function () {
  const puzzle = new PuzzleFixture('011')

  after(puzzle.after)
  before(puzzle.before)

  it('should be solved', async function () {
    await puzzle.solve([
      { type: 'tile-select', tile: '0,0' },
      { type: 'modifier-invoke', modifier: 'Rotate', options: { times: 2 } },
      { type: 'wait', for: 'mask-visible' },
      { type: 'tile-click', tile: '1,0' },
      { type: 'wait', for: 'mask-hidden' },
      { type: 'tile-select', tile: '1,-1' },
      { type: 'modifier-invoke', modifier: 'Rotate', options: { times: 3 } }
    ])

    assert(await puzzle.isSolved())
  })
})
