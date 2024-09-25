/* eslint-env mocha */
const { PuzzleFixture } = require('../fixtures.js')
const assert = require('assert')

describe('Puzzle 012', function () {
  const puzzle = new PuzzleFixture('012')

  after(puzzle.after)
  before(puzzle.before)

  it('should be solved', async function () {
    await puzzle.clickTile(1, 3)
    await puzzle.clickModifier('rotate')

    await puzzle.clickTile(3, 0)
    await puzzle.clickModifier('move')
    await puzzle.clickTile(0, 3)
    await puzzle.isMasked()
    await puzzle.clickTile(3, 5)

    await puzzle.clickTile(3, 6)
    await puzzle.clickModifier('move')
    await puzzle.clickTile(0, 2)
    await puzzle.isMasked()
    await puzzle.clickTile(3, 1)

    await puzzle.clickTile(4, 1)
    await puzzle.clickModifier('rotate', { times: 3 })

    await puzzle.clickTile(4, 4)
    await puzzle.clickModifier('rotate', { times: 3 })

    await puzzle.clickTile(4, 1)
    await puzzle.clickModifier('move')
    await puzzle.clickTile(1, 4)
    await puzzle.isMasked()
    await puzzle.clickTile(3, 1)

    await puzzle.clickTile(4, 4)
    await puzzle.clickModifier('move')
    await puzzle.clickTile(1, 2)
    await puzzle.isMasked()
    await puzzle.clickTile(3, 5)

    await puzzle.clickTile(3, 2)
    await puzzle.clickModifier('move')
    await puzzle.clickTile(2, 2)

    await puzzle.clickTile(3, 4)
    await puzzle.clickModifier('move')
    await puzzle.clickTile(2, 3)

    await puzzle.clickTile(2, 0)
    await puzzle.clickModifier('rotate', { times: 2 })

    await puzzle.clickTile(2, 5)
    await puzzle.clickModifier('rotate', { times: 4 })

    assert(await puzzle.isSolved())
  })
})
