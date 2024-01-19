/* eslint-env mocha */
const { PuzzleFixture } = require('../fixtures.js')
const assert = require('assert')

describe('Puzzle 004', function () {
  const puzzle = new PuzzleFixture('004')

  after(puzzle.after)
  before(puzzle.before)

  it('should be solved', async function () {
    await puzzle.clickTile(0, 0)
    await puzzle.clickModifier('rotate', { times: 3 })

    await puzzle.clickTile(2, 0)
    await puzzle.clickModifier('swap')
    await puzzle.clickTile(0, 0)

    assert(await puzzle.isSolved())
  })
})
