/* eslint-env mocha */
const { PuzzleFixture } = require('../fixtures.js')
const assert = require('assert')

describe('Puzzle 007', function () {
  const puzzle = new PuzzleFixture('007')

  after(puzzle.after)
  before(puzzle.before)

  it('should be solved', async function () {
    await puzzle.solve([
      { eventType: 'modifier-invoked', modifierType: 'Move', selectedTile: '0,-2', tile: '1,-1' },
      { eventType: 'modifier-invoked', modifierType: 'Move', selectedTile: '0,2', tile: '1,0' },
      { eventType: 'modifier-invoked', modifierType: 'Rotate', tile: '0,0' },
      { eventType: 'modifier-invoked', modifierType: 'Move', selectedTile: '0,1', tile: '0,0' }
    ])

    assert(await puzzle.isSolved())
  })
})
