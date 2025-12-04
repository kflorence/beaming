/* eslint-env mocha */
import { PuzzleFixture } from '../fixtures.js'
import assert from 'assert'

describe('Puzzle 003', function () {
  const puzzle = new PuzzleFixture('003')

  after(puzzle.after)
  before(puzzle.before)

  it('should be solved', async function () {
    await puzzle.solve([
      { eventType: 'modifier-invoked', modifierType: 'Toggle', tile: '2,-1' },
      { eventType: 'modifier-invoked', modifierType: 'Toggle', tile: '2,1' },
      { eventType: 'modifier-invoked', modifierType: 'Toggle', tile: '-2,1' },
      { eventType: 'modifier-invoked', modifierType: 'Toggle', tile: '-2,-1' },
      { eventType: 'modifier-invoked', modifierType: 'Toggle', tile: '0,0' },
      { eventType: 'modifier-invoked', modifierType: 'Toggle', tile: '1,-2' },
      { eventType: 'modifier-invoked', modifierType: 'Toggle', tile: '1,-2' },
      { eventType: 'modifier-invoked', modifierType: 'Toggle', tile: '-2,-1' },
      { eventType: 'modifier-invoked', modifierType: 'Toggle', tile: '-2,0' },
      { eventType: 'modifier-invoked', modifierType: 'Toggle', tile: '2,0' },
      { eventType: 'modifier-invoked', modifierType: 'Toggle', tile: '-2,-1' },
      { eventType: 'modifier-invoked', modifierType: 'Toggle', tile: '1,-2' },
      { eventType: 'modifier-invoked', modifierType: 'Toggle', tile: '-1,1' },
      { eventType: 'modifier-invoked', modifierType: 'Toggle', tile: '0,0' }
    ])

    assert(await puzzle.isSolved())
  })
})
