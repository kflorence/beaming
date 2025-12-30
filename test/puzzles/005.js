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
      { type: 'modifier-invoke', modifier: 'rotate' },
      { type: 'modifier-invoke', modifier: 'swap' },
      { type: 'tile-click', tile: '0,-1' },
      { type: 'tile-select', tile: '1,-1' },
      { type: 'modifier-invoke', modifier: 'rotate', options: { button: Button.MIDDLE } },
      { type: 'modifier-invoke', modifier: 'rotate', options: { times: 2 } },
      { type: 'modifier-invoke', modifier: 'swap' },
      { type: 'tile-click', tile: '0,-1' },
      { type: 'tile-select', tile: '1,-1' },
      { type: 'modifier-invoke', modifier: 'swap' },
      { type: 'tile-select', tile: '-1,0' },
      { type: 'modifier-invoke', modifier: 'move' },
      { type: 'tile-click', tile: '1,0' },
      { type: 'tile-select', tile: '1,-1' },
      { type: 'modifier-invoke', modifier: 'rotate' }
    ])

    assert(await puzzle.isSolved())
  })
})
