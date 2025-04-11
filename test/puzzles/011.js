/* eslint-env mocha */
const { PuzzleFixture } = require('../fixtures.js')
const assert = require('assert')

describe('Puzzle 011', function () {
  const puzzle = new PuzzleFixture('011')

  after(puzzle.after)
  before(puzzle.before)

  it('should be solved', async function () {
    await puzzle.solve([
      { eventType: 'modifier-invoked', modifierType: 'Rotate', tile: '0,0' },
      { eventType: 'modifier-invoked', modifierType: 'Rotate', tile: '0,0' },
      { eventType: 'mask-visible' },
      { eventType: 'portal-exit', tile: '1,0' },
      // FIXME: For some reason the test is flaky without selecting the tile again
      { eventType: 'portal-exit', tile: '1,0' },
      { eventType: 'mask-hidden' },
      { eventType: 'modifier-invoked', modifierType: 'Rotate', tile: '1,-1' },
      { eventType: 'modifier-invoked', modifierType: 'Rotate', tile: '1,-1' },
      { eventType: 'modifier-invoked', modifierType: 'Rotate', tile: '1,-1' }
    ])

    assert(await puzzle.isSolved())
  })
})
