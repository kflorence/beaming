/* eslint-env mocha */
const { PuzzleFixture } = require('../fixtures.js')
const assert = require('assert')

describe('Puzzle 003', function () {
  const puzzle = new PuzzleFixture('003')

  after(puzzle.after)
  before(puzzle.before)

  it('should be solved', async function () {
    await puzzle.clickTile(2, 1)
    await puzzle.selectModifier('rotate')
    await puzzle.clickTile(2, 0)
    await puzzle.clickModifier('rotate')

    assert(await puzzle.isSolved())
  })
})
