/* eslint-env mocha */
const { PuzzleFixture } = require('../fixtures.js')
const assert = require('assert')

describe('Puzzle 012', function () {
  const puzzle = new PuzzleFixture('012')

  after(puzzle.after)
  before(puzzle.before)

  it('should be solved', async function () {
    await puzzle.solve([
      { eventType: 'modifier-invoked', modifierType: 'Rotate', tile: '-1,-1' },
      { eventType: 'modifier-invoked', modifierType: 'Move', selectedTile: '-2,0', tile: '1,-4' },
      { eventType: 'modifier-invoked', modifierType: 'Move', selectedTile: '-2,-1', tile: '1,2' },
      { eventType: 'modifier-invoked', modifierType: 'Rotate', tile: '2,-2' },
      { eventType: 'modifier-invoked', modifierType: 'Rotate', tile: '2,-2' },
      { eventType: 'modifier-invoked', modifierType: 'Rotate', tile: '2,-2' },
      { eventType: 'modifier-invoked', modifierType: 'Rotate', tile: '2,1' },
      { eventType: 'modifier-invoked', modifierType: 'Rotate', tile: '2,1' },
      { eventType: 'modifier-invoked', modifierType: 'Rotate', tile: '2,1' },
      { eventType: 'modifier-invoked', modifierType: 'Move', selectedTile: '-1,0', tile: '2,-2' },
      { eventType: 'modifier-invoked', modifierType: 'Move', selectedTile: '-1,-2', tile: '2,1' },
      { eventType: 'modifier-invoked', modifierType: 'Move', selectedTile: '0,-1', tile: '1,-2' },
      { eventType: 'modifier-invoked', modifierType: 'Move', selectedTile: '0,0', tile: '1,0' },
      { eventType: 'modifier-invoked', modifierType: 'Toggle', tile: '-1,-1' },
      { eventType: 'portal-exit', tile: '1,1' },
      { eventType: 'portal-exit', tile: '1,-3' },
      { eventType: 'portal-exit', tile: '1,1' },
      { eventType: 'portal-exit', tile: '1,-3' },
      { eventType: 'modifier-invoked', modifierType: 'Rotate', tile: '0,-3' },
      { eventType: 'modifier-invoked', modifierType: 'Rotate', tile: '0,-3' },
      { eventType: 'modifier-invoked', modifierType: 'Rotate', tile: '0,2' },
      { eventType: 'modifier-invoked', modifierType: 'Rotate', tile: '0,2' },
      { eventType: 'modifier-invoked', modifierType: 'Rotate', tile: '0,2' },
      { eventType: 'modifier-invoked', modifierType: 'Rotate', tile: '0,2' }
    ])

    assert(await puzzle.isSolved())
  })
})
