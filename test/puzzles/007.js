/* eslint-env mocha */
const { PuzzleFixture } = require('../fixtures.js')
const assert = require('assert')

describe('Puzzle 007', function () {
  const puzzle = new PuzzleFixture('007')

  after(puzzle.after)
  before(puzzle.before)

  it('should be solved', async function () {
    await puzzle.clickTile(2, 2)
    await puzzle.clickModifier('move')
    await puzzle.clickTile(1, 0)

    await puzzle.clickTile(2, 3)
    await puzzle.clickModifier('move')
    await puzzle.clickTile(1, 4)

    await puzzle.clickTile(1, 2)
    await puzzle.clickModifier('rotate')
    await puzzle.clickModifier('move')
    await puzzle.clickTile(1, 3)

    assert(await puzzle.isSolved())
  })
})
