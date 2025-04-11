/* eslint-env mocha */
const { PuzzleFixture } = require('../fixtures.js')
const assert = require('assert')

describe('Puzzle 002', function () {
  const puzzle = new PuzzleFixture('002')

  after(puzzle.after)
  before(puzzle.before)

  it('should be solved', async function () {
    await puzzle.solve([
      { eventType: 'modifier-invoked', modifierType: 'Toggle', tile: '0,0' },
      { eventType: 'modifier-invoked', modifierType: 'Toggle', tile: '-1,0' },
      { eventType: 'modifier-invoked', modifierType: 'Toggle', tile: '1,0' },
      { eventType: 'modifier-invoked', modifierType: 'Toggle', tile: '0,1' }
    ])

    assert(await puzzle.isSolved())
  })
})
