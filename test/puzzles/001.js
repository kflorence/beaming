/* eslint-env mocha */
const { PuzzleFixture } = require('../fixtures.js')
const assert = require('assert')

describe('Puzzle 001', function () {
  const puzzle = new PuzzleFixture('001')

  after(puzzle.after)
  before(puzzle.before)

  it('should be solved', async function () {
    await puzzle.clickTile(1, -1)
    await puzzle.clickModifier('toggle')

    assert(await puzzle.isSolved())
  })
})
