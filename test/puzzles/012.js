/* eslint-env mocha */
const { PuzzleFixture } = require('../fixtures.js')
const assert = require('assert')

describe('Puzzle 012', function () {
  const puzzle = new PuzzleFixture('012')

  after(puzzle.after)
  before(puzzle.before)

  it('should be solved', async function () {
    await puzzle.clickTile(1, 3)
    await puzzle.clickModifier('rotate')

    assert(await puzzle.isSolved())
  })
})
