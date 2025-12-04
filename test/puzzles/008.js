/* eslint-env mocha */
import { PuzzleFixture } from '../fixtures.js'
import assert from 'assert'

describe('Puzzle 008', function () {
  const puzzle = new PuzzleFixture('008')

  after(puzzle.after)
  before(puzzle.before)

  it('should be solved', async function () {
    await puzzle.solve([
      { eventType: 'modifier-invoked', modifierType: 'Swap', selectedTile: '0,0', tile: '1,1' },
      { eventType: 'modifier-invoked', modifierType: 'Move', selectedTile: '1,-1', tile: '0,0' },
      { eventType: 'modifier-invoked', modifierType: 'Rotate', tile: '1,-1' },
      { eventType: 'modifier-invoked', modifierType: 'Rotate', tile: '1,-1' },
      { eventType: 'modifier-invoked', modifierType: 'Swap', selectedTile: '0,-1', tile: '-1,-3' },
      { eventType: 'modifier-invoked', modifierType: 'Move', selectedTile: '-1,-1', tile: '0,-1' },
      { eventType: 'modifier-invoked', modifierType: 'Toggle', tile: '-1,-1' },
      { eventType: 'modifier-invoked', modifierType: 'Swap', selectedTile: '1,-1', tile: '-1,-1' },
      { eventType: 'modifier-invoked', modifierType: 'Rotate', tile: '1,-1' },
      { eventType: 'modifier-invoked', modifierType: 'Rotate', tile: '1,-1' },
      { eventType: 'modifier-invoked', modifierType: 'Swap', selectedTile: '1,1', tile: '1,-1' },
      { eventType: 'modifier-invoked', modifierType: 'Rotate', tile: '1,-1' },
      { eventType: 'modifier-invoked', modifierType: 'Swap', selectedTile: '1,1', tile: '1,-1' },
      { eventType: 'modifier-invoked', modifierType: 'Toggle', tile: '-1,-1' },
      { eventType: 'modifier-invoked', modifierType: 'Swap', selectedTile: '1,-1', tile: '-1,-3' },
      { eventType: 'modifier-invoked', modifierType: 'Rotate', tile: '1,-1' },
      { eventType: 'modifier-invoked', modifierType: 'Swap', selectedTile: '-1,-3', tile: '1,-1' }
    ])

    assert(await puzzle.isSolved())
  })
})
