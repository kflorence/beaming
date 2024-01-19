/* eslint-env mocha */
const { PuzzleFixture } = require('../fixtures.js')
const assert = require('assert')

describe('Puzzle 010', function () {
  const puzzle = new PuzzleFixture('010')

  after(puzzle.after)
  before(puzzle.before)

  it('should be solved', async function () {
    await puzzle.clickTile(1, 1)
    await puzzle.clickModifier('move')
    await puzzle.clickTile(2, 4)

    await puzzle.clickTile(1, 1)
    await puzzle.selectModifier('move')
    await puzzle.clickTile(1, 5)
    await puzzle.clickModifier('move')
    await puzzle.clickTile(0, 5)

    await puzzle.clickTile(1, 5)
    await puzzle.selectModifier('move')
    await puzzle.clickTile(1, 0)
    await puzzle.clickModifier('move')
    await puzzle.clickTile(2, 5)

    assert(await puzzle.isSolved())
  })
})
