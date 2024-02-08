/* eslint-env mocha */
const { PuzzleFixture } = require('../fixtures.js')
const assert = require('assert')

describe('Puzzle 011', function () {
  const puzzle = new PuzzleFixture('011')

  after(puzzle.after)
  before(puzzle.before)

  it('should be solved', async function () {
    await puzzle.clickTile(1, 1)
    await puzzle.clickModifier('rotate', { times: 2 })
    await puzzle.isMasked()
    await puzzle.clickTile(2, 1)
    await puzzle.isNotMasked()

    await puzzle.clickTile(1, 1)
    await puzzle.selectModifier('rotate')
    await puzzle.clickTile(2, 0)
    await puzzle.clickModifier('rotate', { times: 3 })

    assert(await puzzle.isSolved())
  })
})
