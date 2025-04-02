/* eslint-env mocha */
const { PuzzleFixture } = require('../fixtures.js')
const assert = require('assert')

describe('Puzzle 007', function () {
  const puzzle = new PuzzleFixture('007')

  after(puzzle.after)
  before(puzzle.before)

  it('should be solved', async function () {
    await puzzle.clickTile(1, -1)
    await puzzle.clickModifier('move')
    await puzzle.clickTile(0, -2)

    await puzzle.clickTile(1, 0)
    await puzzle.clickModifier('move')
    await puzzle.clickTile(0, 2)

    await puzzle.clickTile(0, 0)
    await puzzle.clickModifier('rotate')
    await puzzle.clickModifier('move')
    await puzzle.clickTile(0, 1)

    assert(await puzzle.isSolved())
  })
})
