/* eslint-env mocha */
const { PuzzleFixture } = require('../fixtures.js')
const assert = require('assert')

describe('Puzzle 009', function () {
  const puzzle = new PuzzleFixture('009')

  after(puzzle.after)
  before(puzzle.before)

  it('should be solved', async function () {
    await puzzle.solve([
      { eventType: 'modifier-invoked', modifierType: 'Move', selectedTile: '1,2', tile: '0,2' },
      { eventType: 'modifier-invoked', modifierType: 'Move', selectedTile: '-1,-3', tile: '0,-2' },
      { eventType: 'modifier-invoked', modifierType: 'Move', selectedTile: '-1,2', tile: '0,1' }
    ])

    assert(await puzzle.isSolved())
  })
})
