/* eslint-env mocha */
const { PuzzleFixture } = require('../fixtures.js')
const assert = require('assert')

describe('Puzzle 002', function () {
  const puzzle = new PuzzleFixture('002')

  after(puzzle.after)
  before(puzzle.before)

  it('should be solved', async function () {
    await puzzle.clickTile(0, 0)
    await puzzle.clickModifier('toggle')

    await puzzle.clickTile(2, 0)
    await puzzle.clickModifier('toggle')

    assert(await puzzle.isSolved())
  })
})
