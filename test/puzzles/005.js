/* eslint-env mocha */
const { PuzzleFixture } = require('../fixtures.js')
const assert = require('assert')

describe('Puzzle 005', function () {
  const puzzle = new PuzzleFixture('005')

  after(puzzle.after)
  before(puzzle.before)

  it('should be solved', async function () {
    await puzzle.solve([
      { eventType: 'modifier-invoked', modifierType: 'Rotate', tile: '1,-1' },
      { eventType: 'modifier-invoked', modifierType: 'Swap', selectedTile: '0,-1', tile: '1,-1' },
      { eventType: 'modifier-toggled', modifierType: 'Rotate', tile: '1,-1' },
      { eventType: 'modifier-invoked', modifierType: 'Rotate', tile: '1,-1' },
      { eventType: 'modifier-invoked', modifierType: 'Rotate', tile: '1,-1' },
      { eventType: 'modifier-invoked', modifierType: 'Swap', selectedTile: '0,-1', tile: '1,-1' },
      { eventType: 'modifier-invoked', modifierType: 'Swap', selectedTile: '-1,0', tile: '1,-1' },
      { eventType: 'modifier-invoked', modifierType: 'Move', selectedTile: '1,0', tile: '-1,0' },
      { eventType: 'modifier-invoked', modifierType: 'Rotate', tile: '1,-1' }
    ])

    assert(await puzzle.isSolved())
  })
})
