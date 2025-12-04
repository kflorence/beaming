/* eslint-env mocha */
import { PuzzleFixture } from '../fixtures.js'
import assert from 'assert'

describe('Puzzle 001', function () {
  const puzzle = new PuzzleFixture('001')

  after(puzzle.after)
  before(puzzle.before)

  it('should be solved', async function () {
    await puzzle.solve([
      { eventType: 'modifier-invoked', modifierType: 'Toggle', tile: '1,-1' }
    ])

    assert(await puzzle.isSolved())
  })
})
