/* eslint-env mocha */
const { PuzzleFixture } = require('../fixtures.js')
const assert = require('assert')

describe('Puzzle 006', function () {
  const puzzle = new PuzzleFixture('006')

  after(puzzle.after)
  before(puzzle.before)

  it('should be solved', async function () {
    await puzzle.clickTile(0, 0)
    await puzzle.clickModifier('swap')
    await puzzle.clickTile(1, 0)

    await puzzle.clickTile(0, 0)
    await puzzle.clickModifier('swap')
    await puzzle.clickTile(0, 1)

    await puzzle.clickTile(0, 0)
    await puzzle.clickModifier('swap')
    await puzzle.clickTile(1, 0)

    await puzzle.clickTile(2, 1)
    await puzzle.clickModifier('swap')
    await puzzle.clickTile(2, 0)

    await puzzle.clickTile(2, 1)
    await puzzle.clickModifier('swap')
    await puzzle.clickTile(1, 2)

    await puzzle.clickTile(2, 1)
    await puzzle.clickModifier('swap')
    await puzzle.clickTile(2, 0)

    assert(await puzzle.isSolved())
  })
})
