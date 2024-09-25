/* eslint-env mocha */
const { PuzzleFixture } = require('../fixtures.js')
const assert = require('assert')

describe('Puzzle 009', function () {
  const puzzle = new PuzzleFixture('009')

  after(puzzle.after)
  before(puzzle.before)

  it('should be solved', async function () {
    await puzzle.clickTile(1, 1)
    await puzzle.clickModifier('move')
    await puzzle.clickTile(0, 0)

    await puzzle.clickTile(1, 5)
    await puzzle.clickModifier('move')
    await puzzle.clickTile(2, 5)

    await puzzle.clickTile(1, 4)
    await puzzle.clickModifier('move')
    await puzzle.clickTile(0, 5)

    assert(await puzzle.isSolved())
  })
})
