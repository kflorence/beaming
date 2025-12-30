/* eslint-env mocha */
import { PuzzleFixture } from '../fixtures.js'
import assert from 'assert'

describe('Puzzle 008', function () {
  const puzzle = new PuzzleFixture('008')

  after(puzzle.after)
  before(puzzle.before)

  it('should be solved', async function () {
    await puzzle.solve([
      { type: 'tile-select', tile: '1,1' },
      { type: 'modifier-invoke', modifier: 'swap' },
      { type: 'tile-select', tile: '0,0' },
      { type: 'modifier-invoke', modifier: 'move' },
      { type: 'tile-select', tile: '1,-1' },
      { type: 'modifier-invoke', modifier: 'rotate', options: { times: 2 } },
      { type: 'tile-select', tile: '-1,-3' },
      { type: 'modifier-invoke', modifier: 'swap' },
      { type: 'tile-select', tile: '0,-1' },
      { type: 'modifier-invoke', modifier: 'move' },
      { type: 'tile-select', tile: '-1,-1' },
      { type: 'modifier-invoke', modifier: 'toggle' },
      { type: 'modifier-invoke', modifier: 'swap' },
      { type: 'tile-select', tile: '1,-1' },
      { type: 'modifier-invoke', modifier: 'rotate', options: { times: 2 } },
      { type: 'modifier-invoke', modifier: 'swap' },
      { type: 'tile-click', tile: '1,1' },
      { type: 'tile-select', tile: '1,-1' },
      { type: 'modifier-invoke', modifier: 'rotate' },
      { type: 'modifier-invoke', modifier: 'swap' },
      { type: 'tile-select', tile: '1,1' },
      { type: 'tile-select', tile: '-1,-1' },
      { type: 'modifier-invoke', modifier: 'toggle' },
      { type: 'tile-select', tile: '-1,-3' },
      { type: 'modifier-invoke', modifier: 'swap' },
      { type: 'tile-select', tile: '1,-1' },
      { type: 'modifier-invoke', modifier: 'rotate' },
      { type: 'modifier-invoke', modifier: 'swap' },
      { type: 'tile-click', tile: '-1,-3' }
    ])

    assert(await puzzle.isSolved())
  })
})
