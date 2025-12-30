/* eslint-env mocha */
import { PuzzleFixture } from '../fixtures.js'
import assert from 'assert'

describe('Puzzle 002', function () {
  const puzzle = new PuzzleFixture('002')

  after(puzzle.after)
  before(puzzle.before)

  it('should be solved', async function () {
    await puzzle.solve([
      { type: 'tile-select', tile: '0,0' },
      { type: 'modifier-invoke', modifier: 'toggle' },
      { type: 'tile-select', tile: '-1,0' },
      { type: 'modifier-invoke', modifier: 'toggle' },
      { type: 'tile-select', tile: '1,0' },
      { type: 'modifier-invoke', modifier: 'toggle' },
      { type: 'tile-select', tile: '0,1' },
      { type: 'modifier-invoke', modifier: 'toggle' }
    ])

    assert(await puzzle.isSolved())
  })
})
