/* eslint-env mocha */
const { PuzzleFixture } = require('../fixtures.js')
const assert = require('assert')

describe('Puzzle 010', function () {
  const puzzle = new PuzzleFixture('010')

  after(puzzle.after)
  before(puzzle.before)

  it('should be solved', async function () {
    await puzzle.solve([
      { eventType: 'modifier-invoked', modifierType: 'Move', selectedTile: '1,1', tile: '0,-2' },
      { eventType: 'modifier-invoked', modifierType: 'Move', selectedTile: '-1,2', tile: '0,2' },
      { eventType: 'modifier-invoked', modifierType: 'Move', selectedTile: '1,2', tile: '0,-3' }
    ])

    assert(await puzzle.isSolved())
  })
})
