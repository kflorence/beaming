/* eslint-env mocha */
const { PuzzleFixture } = require('../fixtures.js')
const assert = require('assert')

describe('Puzzle 008', function () {
  const puzzle = new PuzzleFixture('008')

  after(puzzle.after)
  before(puzzle.before)

  it('should be solved', async function () {
    await puzzle.clickTile(0, 0)
    await puzzle.clickModifier('swap')
    await puzzle.clickTile(2, 4)

    await puzzle.clickTile(1, 3)
    await puzzle.clickModifier('move')
    await puzzle.clickTile(2, 2)

    await puzzle.clickTile(1, 0)
    await puzzle.clickModifier('move')
    await puzzle.clickTile(0, 1)
    await puzzle.clickModifier('rotate', { right: true })
    await puzzle.clickModifier('rotate')

    await puzzle.clickTile(2, 4)
    await puzzle.clickModifier('swap')
    await puzzle.clickTile(2, 2)
    await puzzle.clickModifier('toggle')

    await puzzle.clickTile(2, 4)
    await puzzle.clickModifier('swap')
    await puzzle.clickTile(0, 1)

    await puzzle.clickTile(2, 4)
    await puzzle.clickModifier('swap')
    await puzzle.clickTile(2, 2)

    await puzzle.clickTile(2, 4)
    await puzzle.clickModifier('swap')
    await puzzle.clickTile(0, 1)
    await puzzle.clickModifier('rotate', { right: true })
    await puzzle.clickModifier('rotate', { times: 2 })

    await puzzle.clickTile(2, 4)
    await puzzle.clickModifier('swap')
    await puzzle.clickTile(0, 1)
    await puzzle.clickModifier('rotate', { right: true })
    await puzzle.clickModifier('rotate')

    await puzzle.clickTile(1, 1)
    await puzzle.clickModifier('move')
    await puzzle.clickTile(0, 2)

    await puzzle.clickTile(0, 0)
    await puzzle.clickModifier('swap')
    await puzzle.clickTile(0, 1)
    await puzzle.clickModifier('rotate', { right: true })
    await puzzle.clickModifier('rotate', { times: 2 })

    await puzzle.clickTile(0, 0)
    await puzzle.clickModifier('swap')
    await puzzle.clickTile(0, 2)

    await puzzle.clickTile(0, 0)
    await puzzle.clickModifier('swap')
    await puzzle.clickTile(0, 1)

    await puzzle.clickTile(0, 0)
    await puzzle.clickModifier('swap')
    await puzzle.clickTile(0, 2)
    await puzzle.clickModifier('toggle')

    await puzzle.clickTile(0, 0)
    await puzzle.clickModifier('swap')
    await puzzle.clickTile(0, 2)

    assert(await puzzle.isSolved())
  })
})
