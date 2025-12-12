/* eslint-env mocha */
import { PuzzleFixture } from '../fixtures.js'
import assert from 'assert'

describe('Puzzle 012', function () {
  const puzzle = new PuzzleFixture('012')

  after(puzzle.after)
  before(puzzle.before)

  it('should be solved', async function () {
    await puzzle.solve([
      { type: 'tile-select', tile: '-1,-1' },
      { type: 'modifier-invoke', modifier: 'Rotate' },
      { type: 'tile-select', tile: '1,-4' },
      { type: 'modifier-invoke', modifier: 'Move' },
      { type: 'tile-click', tile: '-2,0' },
      { type: 'tile-select', tile: '1,2' },
      { type: 'modifier-invoke', modifier: 'Move' },
      { type: 'tile-select', tile: '-2,-1' },
      { type: 'tile-select', tile: '2,-2' },
      { type: 'modifier-invoke', modifier: 'Rotate', options: { times: 3 } },
      { type: 'tile-select', tile: '2,1' },
      { type: 'modifier-invoke', modifier: 'Rotate', options: { times: 3 } },
      { type: 'tile-select', tile: '2,-2' },
      { type: 'modifier-invoke', modifier: 'Move' },
      { type: 'tile-click', tile: '-1,0' },
      { type: 'tile-select', tile: '2,1' },
      { type: 'modifier-invoke', modifier: 'Move' },
      { type: 'tile-click', tile: '-1,-2' },
      { type: 'tile-select', tile: '1,-2' },
      { type: 'modifier-invoke', modifier: 'Move' },
      { type: 'tile-click', tile: '0,-1' },
      { type: 'tile-select', tile: '1,0' },
      { type: 'modifier-invoke', modifier: 'Move' },
      { type: 'tile-click', tile: '0,0' },
      { type: 'tile-select', tile: '-1,-1' },
      { type: 'modifier-invoke', modifier: 'Toggle' },
      { type: 'wait', for: 'mask-visible' },
      { type: 'tile-click', tile: '1,1' },
      { type: 'tile-click', tile: '1,-3' },
      { type: 'tile-click', tile: '1,1' },
      { type: 'tile-click', tile: '1,-3' },
      { type: 'tile-select', tile: '0,-3' },
      { type: 'wait', for: 'mask-hidden' },
      { type: 'modifier-invoke', modifier: 'Rotate', options: { times: 2 } },
      { type: 'tile-select', tile: '0,2' },
      { type: 'modifier-invoke', modifier: 'Rotate', options: { times: 4 } }
    ])

    assert(await puzzle.isSolved())
  })
})
