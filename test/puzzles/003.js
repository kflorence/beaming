/* eslint-env mocha */
import { PuzzleFixture } from '../fixtures.js'
import assert from 'assert'

describe('Puzzle 003', function () {
  const puzzle = new PuzzleFixture('003')

  after(puzzle.after)
  before(puzzle.before)

  it('should be solved', async function () {
    await puzzle.solve([
      { type: 'tile-select', tile: '2,-1' },
      { type: 'modifier-invoke', modifier: 'Toggle' },
      { type: 'tile-select', tile: '2,1' },
      { type: 'modifier-invoke', modifier: 'Toggle' },
      { type: 'tile-select', tile: '-2,1' },
      { type: 'modifier-invoke', modifier: 'Toggle' },
      { type: 'tile-select', tile: '-2,-1' },
      { type: 'modifier-invoke', modifier: 'Toggle' },
      { type: 'tile-select', tile: '0,0' },
      { type: 'modifier-invoke', modifier: 'Toggle' },
      { type: 'tile-select', tile: '1,-2' },
      { type: 'modifier-invoke', modifier: 'Toggle' },
      { type: 'tile-select', tile: '1,-2' },
      { type: 'modifier-invoke', modifier: 'Toggle' },
      { type: 'tile-select', tile: '-2,-1' },
      { type: 'modifier-invoke', modifier: 'Toggle' },
      { type: 'tile-select', tile: '-2,0' },
      { type: 'modifier-invoke', modifier: 'Toggle' },
      { type: 'tile-select', tile: '2,0' },
      { type: 'modifier-invoke', modifier: 'Toggle' },
      { type: 'tile-select', tile: '-2,-1' },
      { type: 'modifier-invoke', modifier: 'Toggle' },
      { type: 'tile-select', tile: '1,-2' },
      { type: 'modifier-invoke', modifier: 'Toggle' },
      { type: 'tile-select', tile: '-1,1' },
      { type: 'modifier-invoke', modifier: 'Toggle' },
      { type: 'tile-select', tile: '0,0' },
      { type: 'modifier-invoke', modifier: 'Toggle' }
    ])

    assert(await puzzle.isSolved())
  })
})
