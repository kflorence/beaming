/* eslint-env mocha */
import { PuzzleFixture } from '../fixtures.js'
import assert from 'assert'
import { Button } from 'selenium-webdriver'

describe('Puzzle 005', function () {
  const puzzle = new PuzzleFixture('005')

  after(puzzle.after)
  before(puzzle.before)

  it('should be solved', async function () {
    await puzzle.solve([
      { type: 'tile-select', tile: '1,-1' },
      { type: 'modifier-invoke', modifier: 'Rotate' },
      { type: 'modifier-invoke', modifier: 'Swap' },
      { type: 'tile-click', tile: '0,-1' },
      { type: 'tile-select', tile: '1,-1' },
      { type: 'modifier-invoke', modifier: 'Rotate', options: { button: Button.MIDDLE } },
      { type: 'modifier-invoke', modifier: 'Rotate', options: { times: 2 } },
      { type: 'modifier-invoke', modifier: 'Swap' },
      { type: 'tile-click', tile: '0,-1' },
      { type: 'tile-select', tile: '1,-1' },
      { type: 'modifier-invoke', modifier: 'Swap' },
      { type: 'tile-select', tile: '-1,0' },
      { type: 'modifier-invoke', modifier: 'Move' },
      { type: 'tile-click', tile: '1,0' },
      { type: 'tile-select', tile: '1,-1' },
      { type: 'modifier-invoke', modifier: 'Rotate' }
    ])

    assert(await puzzle.isSolved())
  })
})
