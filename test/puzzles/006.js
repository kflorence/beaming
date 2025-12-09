/* eslint-env mocha */
import { PuzzleFixture } from '../fixtures.js'
import assert from 'assert'

describe('Puzzle 006', function () {
  const puzzle = new PuzzleFixture('006')

  after(puzzle.after)
  before(puzzle.before)

  it('should be solved', async function () {
    await puzzle.solve([
      { eventType: 'modifier-invoked', modifierType: 'Swap', selectedTile: '0,-1', tile: '-1,-1' },
      { eventType: 'modifier-invoked', modifierType: 'Swap', selectedTile: '-1,0', tile: '-1,-1' },
      { eventType: 'modifier-invoked', modifierType: 'Swap', selectedTile: '0,1', tile: '-1,-1' },
      { eventType: 'modifier-invoked', modifierType: 'Swap', selectedTile: '1,-1', tile: '-1,-1' },
      { eventType: 'modifier-invoked', modifierType: 'Swap', selectedTile: '0,-1', tile: '-1,-1' }
    ])

    assert(await puzzle.isSolved())
  })
})
