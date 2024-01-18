/* eslint-env mocha */
const { PuzzleFixture } = require('../fixtures.js')
const assert = require('assert')

describe('Puzzle 001', function () {
  const puzzle = new PuzzleFixture()

  after(puzzle.after)
  before(puzzle.before)

  it('should be solvable', async function () {
    await puzzle.selectTile(2, 0)
    await puzzle.clickModifier('toggle')

    assert(await puzzle.isSolved())
  })
})
