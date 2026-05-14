/* eslint-env mocha */
import { PuzzleFixture } from '../fixtures.js'
import assert from 'assert'
import { Button } from 'selenium-webdriver'

const puzzle = new PuzzleFixture('001')

after(puzzle.after)
before(puzzle.before)

describe('Puzzle 001-001', function () {
  it('should be solved', async function () {
    await puzzle.solve([
      { type: 'tile-select', tile: '1,-1' },
      { type: 'modifier-invoke', modifier: 'toggle' },
      { type: 'modifier-invoke', modifier: 'puzzle' },
      { type: 'wait', for: 'puzzle-loaded' }
    ])

    await puzzle.solve([
      { type: 'tile-select', tile: '1,-1' },
      { type: 'modifier-invoke', modifier: 'toggle' },
      { type: 'tile-select', tile: '0,-1' },
      { type: 'modifier-invoke', modifier: 'toggle' },
      { type: 'tile-select', tile: '1,0' },
      { type: 'modifier-invoke', modifier: 'toggle' }
    ])

    assert(await puzzle.isSolved())
  })
})

describe('Puzzle 001-002', function () {
  it('should be solved', async function () {
    await puzzle.solve([
      { type: 'continue' },
      { type: 'tile-select', tile: '-1,-2' },
      { type: 'modifier-invoke', modifier: 'rotate', options: { times: 3 } },
      { type: 'tile-select', tile: '1,-1' },
      { type: 'modifier-invoke', modifier: 'rotate' },
      { type: 'modifier-invoke', modifier: 'toggle' },
      { type: 'modifier-invoke', modifier: 'puzzle' },
      { type: 'wait', for: 'puzzle-loaded' }
    ])

    await puzzle.solve([
      { type: 'tile-select', tile: '2,-1' },
      { type: 'modifier-invoke', modifier: 'toggle' },
      { type: 'tile-select', tile: '2,1' },
      { type: 'modifier-invoke', modifier: 'toggle' },
      { type: 'tile-select', tile: '-2,1' },
      { type: 'modifier-invoke', modifier: 'toggle' },
      { type: 'tile-select', tile: '-2,-1' },
      { type: 'modifier-invoke', modifier: 'toggle' },
      { type: 'tile-select', tile: '0,0' },
      { type: 'modifier-invoke', modifier: 'toggle' },
      { type: 'tile-select', tile: '1,-2' },
      { type: 'modifier-invoke', modifier: 'toggle' },
      { type: 'tile-select', tile: '1,-2' },
      { type: 'modifier-invoke', modifier: 'toggle' },
      { type: 'tile-select', tile: '-2,-1' },
      { type: 'modifier-invoke', modifier: 'toggle' },
      { type: 'tile-select', tile: '-2,0' },
      { type: 'modifier-invoke', modifier: 'toggle' },
      { type: 'tile-select', tile: '2,0' },
      { type: 'modifier-invoke', modifier: 'toggle' },
      { type: 'tile-select', tile: '-2,-1' },
      { type: 'modifier-invoke', modifier: 'toggle' },
      { type: 'tile-select', tile: '1,-2' },
      { type: 'modifier-invoke', modifier: 'toggle' },
      { type: 'tile-select', tile: '-1,1' },
      { type: 'modifier-invoke', modifier: 'toggle' },
      { type: 'tile-select', tile: '0,0' },
      { type: 'modifier-invoke', modifier: 'toggle' }
    ])

    assert(await puzzle.isSolved())
  })
})

describe('Puzzle 001-003', function () {
  it('should be solved', async function () {
    await puzzle.solve([
      { type: 'continue' },
      { type: 'tile-select', tile: '-5,0' },
      { type: 'modifier-invoke', modifier: 'swap' },
      { type: 'tile-select', tile: '-4,0' },
      { type: 'tile-select', tile: '-1,-2' },
      { type: 'modifier-invoke', modifier: 'rotate', options: { times: 3 } },
      { type: 'modifier-invoke', modifier: 'puzzle' },
      { type: 'wait', for: 'puzzle-loaded' }
    ])

    await puzzle.solve([
      { type: 'tile-select', tile: '-1,-1' },
      { type: 'modifier-invoke', modifier: 'rotate', options: { times: 3 } },
      { type: 'tile-select', tile: '1,-1' },
      { type: 'modifier-invoke', modifier: 'swap' },
      { type: 'tile-click', tile: '-1,-1' }
    ])

    assert(await puzzle.isSolved())
  })
})

describe('Puzzle 001-004', function () {
  it('should be solved', async function () {
    await puzzle.solve([
      { type: 'continue' },
      { type: 'tile-select', tile: '-1,-2' },
      { type: 'modifier-invoke', modifier: 'rotate', options: { button: Button.MIDDLE } },
      { type: 'modifier-invoke', modifier: 'rotate', options: { times: 2 } },
      { type: 'modifier-invoke', modifier: 'move' },
      { type: 'tile-select', tile: '0,0' },
      { type: 'tile-select', tile: '-5,0' },
      { type: 'modifier-invoke', modifier: 'rotate', options: { times: 2 } },
      { type: 'modifier-invoke', modifier: 'move' },
      { type: 'tile-select', tile: '0,2' },
      { type: 'tile-select', tile: '1,-1' },
      { type: 'modifier-invoke', modifier: 'rotate' },
      { type: 'modifier-invoke', modifier: 'puzzle' },
      { type: 'wait', for: 'puzzle-loaded' }
    ])

    await puzzle.solve([
      { type: 'tile-select', tile: '1,-1' },
      { type: 'modifier-invoke', modifier: 'rotate' },
      { type: 'modifier-invoke', modifier: 'swap' },
      { type: 'tile-click', tile: '0,-1' },
      { type: 'tile-select', tile: '1,-1' },
      { type: 'modifier-invoke', modifier: 'rotate', options: { button: Button.MIDDLE } },
      { type: 'modifier-invoke', modifier: 'rotate', options: { times: 2 } },
      { type: 'modifier-invoke', modifier: 'swap' },
      { type: 'tile-click', tile: '0,-1' },
      { type: 'tile-select', tile: '1,-1' },
      { type: 'modifier-invoke', modifier: 'swap' },
      { type: 'tile-select', tile: '-1,0' },
      { type: 'modifier-invoke', modifier: 'move' },
      { type: 'tile-click', tile: '1,0' },
      { type: 'tile-select', tile: '1,-1' },
      { type: 'modifier-invoke', modifier: 'rotate' }
    ])

    assert(await puzzle.isSolved())
  })
})

describe('Puzzle 001-005', function () {
  it('should be solved', async function () {
    await puzzle.solve([
      { type: 'continue' },
      { type: 'tile-select', tile: '0,0' },
      { type: 'modifier-invoke', modifier: 'rotate' },
      { type: 'tile-select', tile: '-5,3' },
      { type: 'modifier-invoke', modifier: 'move' },
      { type: 'tile-select', tile: '-4,0' },
      { type: 'modifier-invoke', modifier: 'rotate' },
      { type: 'tile-select', tile: '0,2' },
      { type: 'modifier-invoke', modifier: 'swap' },
      { type: 'tile-select', tile: '-5,2' },
      { type: 'tile-select', tile: '0,2' },
      { type: 'modifier-invoke', modifier: 'rotate', options: { times: 2 } },
      { type: 'modifier-invoke', modifier: 'move' },
      { type: 'tile-select', tile: '-4,2' },
      { type: 'tile-select', tile: '-6,2' },
      { type: 'modifier-invoke', modifier: 'rotate', options: { times: 2 } },
      { type: 'modifier-invoke', modifier: 'move' },
      { type: 'tile-select', tile: '-5,3' },
      { type: 'modifier-invoke', modifier: 'puzzle' },
      { type: 'wait', for: 'puzzle-loaded' }
    ])

    await puzzle.solve([
      { type: 'tile-select', tile: '-1,-1' },
      { type: 'modifier-invoke', modifier: 'swap' },
      { type: 'tile-click', tile: '0,-1' },
      { type: 'tile-select', tile: '-1,-1' },
      { type: 'modifier-invoke', modifier: 'swap' },
      { type: 'tile-click', tile: '-1,0' },
      { type: 'tile-select', tile: '-1,-1' },
      { type: 'modifier-invoke', modifier: 'swap' },
      { type: 'tile-click', tile: '0,1' },
      { type: 'tile-select', tile: '-1,-1' },
      { type: 'modifier-invoke', modifier: 'swap' },
      { type: 'tile-click', tile: '1,-1' },
      { type: 'tile-select', tile: '-1,-1' },
      { type: 'modifier-invoke', modifier: 'swap' },
      { type: 'tile-click', tile: '0,-1' }
    ])

    assert(await puzzle.isSolved())
  })
})

describe('Puzzle 001-006', function () {
  it('should be solved', async function () {
    await puzzle.solve([
      { type: 'continue' },
      { type: 'tile-select', tile: '0,0' },
      { type: 'modifier-invoke', modifier: 'rotate', options: { times: 3 } },
      { type: 'modifier-invoke', modifier: 'move' },
      { type: 'tile-select', tile: '-1,-2' },
      { type: 'tile-select', tile: '1,-1' },
      { type: 'modifier-invoke', modifier: 'rotate', options: { button: Button.MIDDLE } },
      { type: 'modifier-invoke', modifier: 'rotate' },
      { type: 'tile-select', tile: '-4,0' },
      { type: 'modifier-invoke', modifier: 'rotate', options: { times: 2 } },
      { type: 'tile-select', tile: '-5,3' },
      { type: 'modifier-invoke', modifier: 'move' },
      { type: 'tile-select', tile: '-4,-2' },
      { type: 'modifier-invoke', modifier: 'rotate', options: { button: Button.MIDDLE } },
      { type: 'modifier-invoke', modifier: 'rotate', options: { times: 2 } },
      { type: 'modifier-invoke', modifier: 'puzzle' },
      { type: 'wait', for: 'puzzle-loaded' }
    ])

    await puzzle.solve([
      { type: 'tile-select', tile: '1,-1' },
      { type: 'modifier-invoke', modifier: 'move' },
      { type: 'tile-click', tile: '0,-2' },
      { type: 'tile-select', tile: '1,0' },
      { type: 'modifier-invoke', modifier: 'move' },
      { type: 'tile-click', tile: '0,2' },
      { type: 'tile-select', tile: '0,0' },
      { type: 'modifier-invoke', modifier: 'rotate' },
      { type: 'modifier-invoke', modifier: 'move' },
      { type: 'tile-click', tile: '0,1' }
    ])

    assert(await puzzle.isSolved())
  })
})

describe('Puzzle 001-007', function () {
  it('should be solved', async function () {
    await puzzle.solve([
      { type: 'continue' },
      { type: 'tile-select', tile: '1,-1' },
      { type: 'modifier-invoke', modifier: 'toggle' },
      { type: 'tile-select', tile: '-8,-1' },
      { type: 'modifier-invoke', modifier: 'move' },
      { type: 'tile-select', tile: '-7,-3' },
      { type: 'modifier-invoke', modifier: 'rotate' },
      { type: 'tile-select', tile: '-8,1' },
      { type: 'modifier-invoke', modifier: 'move' },
      { type: 'tile-select', tile: '-4,-1' },
      { type: 'tile-select', tile: '1,-1' },
      { type: 'modifier-invoke', modifier: 'toggle' },
      { type: 'tile-select', tile: '-1,-2' },
      { type: 'modifier-invoke', modifier: 'move' },
      { type: 'tile-select', tile: '0,0' },
      { type: 'modifier-invoke', modifier: 'rotate', options: { times: 3 } },
      { type: 'tile-select', tile: '-4,0' },
      { type: 'modifier-invoke', modifier: 'rotate', options: { button: Button.MIDDLE } },
      { type: 'modifier-invoke', modifier: 'rotate' },
      { type: 'tile-select', tile: '-7,-3' },
      { type: 'modifier-invoke', modifier: 'rotate' },
      { type: 'tile-select', tile: '-4,-1' },
      { type: 'modifier-invoke', modifier: 'swap' },
      { type: 'tile-select', tile: '-5,2' },
      { type: 'tile-select', tile: '-4,-1' },
      { type: 'modifier-invoke', modifier: 'move' },
      { type: 'tile-select', tile: '-8,-2' },
      { type: 'modifier-invoke', modifier: 'puzzle' },
      { type: 'wait', for: 'puzzle-loaded' }
    ])

    await puzzle.solve([
      { type: 'tile-select', tile: '1,1' },
      { type: 'modifier-invoke', modifier: 'swap' },
      { type: 'tile-select', tile: '0,0' },
      { type: 'modifier-invoke', modifier: 'move' },
      { type: 'tile-select', tile: '1,-1' },
      { type: 'modifier-invoke', modifier: 'rotate', options: { times: 2 } },
      { type: 'tile-select', tile: '-1,-3' },
      { type: 'modifier-invoke', modifier: 'swap' },
      { type: 'tile-select', tile: '0,-1' },
      { type: 'modifier-invoke', modifier: 'move' },
      { type: 'tile-select', tile: '-1,-1' },
      { type: 'modifier-invoke', modifier: 'toggle' },
      { type: 'modifier-invoke', modifier: 'swap' },
      { type: 'tile-select', tile: '1,-1' },
      { type: 'modifier-invoke', modifier: 'rotate', options: { times: 2 } },
      { type: 'modifier-invoke', modifier: 'swap' },
      { type: 'tile-click', tile: '1,1' },
      { type: 'tile-select', tile: '1,-1' },
      { type: 'modifier-invoke', modifier: 'rotate' },
      { type: 'modifier-invoke', modifier: 'swap' },
      { type: 'tile-select', tile: '1,1' },
      { type: 'tile-select', tile: '-1,-1' },
      { type: 'modifier-invoke', modifier: 'toggle' },
      { type: 'tile-select', tile: '-1,-3' },
      { type: 'modifier-invoke', modifier: 'swap' },
      { type: 'tile-select', tile: '1,-1' },
      { type: 'modifier-invoke', modifier: 'rotate' },
      { type: 'modifier-invoke', modifier: 'swap' },
      { type: 'tile-click', tile: '-1,-3' }
    ])

    assert(await puzzle.isSolved())
  })
})

describe('Puzzle 001-008', function () {
  it('should be solved', async function () {
    await puzzle.solve([
      { type: 'continue' },
      { type: 'tile-select', tile: '0,0' },
      { type: 'modifier-invoke', modifier: 'rotate', options: { times: 2 } },
      { type: 'tile-select', tile: '-4,-2' },
      { type: 'modifier-invoke', modifier: 'move' },
      { type: 'tile-select', tile: '0,-3' },
      { type: 'wait', for: 'mask-visible' },
      { type: 'tile-click', tile: '-10,-1' },
      { type: 'wait', for: 'mask-hidden' },
      { type: 'tile-select', tile: '-8,-2' },
      { type: 'modifier-invoke', modifier: 'move' },
      { type: 'tile-select', tile: '-12,-2' },
      { type: 'modifier-invoke', modifier: 'rotate' },
      { type: 'modifier-invoke', modifier: 'puzzle' },
      { type: 'wait', for: 'puzzle-loaded' }
    ])

    await puzzle.solve([
      { type: 'tile-select', tile: '0,2' },
      { type: 'modifier-invoke', modifier: 'move' },
      { type: 'tile-click', tile: '1,2' },
      { type: 'tile-select', tile: '0,-2' },
      { type: 'modifier-invoke', modifier: 'move' },
      { type: 'tile-click', tile: '-1,-3' },
      { type: 'tile-select', tile: '0,1' },
      { type: 'modifier-invoke', modifier: 'move' },
      { type: 'tile-click', tile: '-1,2' }
    ])

    assert(await puzzle.isSolved())
  })
})

describe('Puzzle 001-009', function () {
  it('should be solved', async function () {
    await puzzle.solve([
      { type: 'continue' },
      { type: 'tile-select', tile: '0,0' },
      { type: 'modifier-invoke', modifier: 'rotate', options: { button: Button.MIDDLE } },
      { type: 'modifier-invoke', modifier: 'rotate', options: { times: 2 } },
      { type: 'tile-select', tile: '0,-3' },
      { type: 'modifier-invoke', modifier: 'move' },
      { type: 'tile-select', tile: '-9,-1' },
      { type: 'tile-select', tile: '-12,-2' },
      { type: 'modifier-invoke', modifier: 'move' },
      { type: 'tile-select', tile: '-9,1' },
      { type: 'modifier-invoke', modifier: 'rotate' },
      { type: 'tile-select', tile: '-4,0' },
      { type: 'modifier-invoke', modifier: 'move' },
      { type: 'tile-select', tile: '2,7' },
      { type: 'modifier-invoke', modifier: 'rotate', options: { times: 2 } },
      { type: 'tile-select', tile: '1,-1' },
      { type: 'modifier-invoke', modifier: 'rotate' },
      { type: 'modifier-invoke', modifier: 'toggle' },
      { type: 'wait', for: 'mask-visible' },
      { type: 'tile-click', tile: '-10,-1' },
      { type: 'wait', for: 'mask-visible' },
      { type: 'tile-click', tile: '3,6' },
      { type: 'wait', for: 'mask-hidden' },
      { type: 'modifier-invoke', modifier: 'puzzle' },
      { type: 'wait', for: 'puzzle-loaded' }
    ])

    await puzzle.solve([
      { type: 'tile-select', tile: '0,-2' },
      { type: 'modifier-invoke', modifier: 'move' },
      { type: 'tile-click', tile: '1,1' },
      { type: 'tile-select', tile: '0,2' },
      { type: 'modifier-invoke', modifier: 'move' },
      { type: 'tile-click', tile: '-1,2' },
      { type: 'tile-select', tile: '0,-3' },
      { type: 'modifier-invoke', modifier: 'move' },
      { type: 'tile-click', tile: '1,2' }
    ])

    assert(await puzzle.isSolved())
  })
})

describe('Puzzle 001-010', function () {
  it('should be solved', async function () {
    await puzzle.solve([
      { type: 'continue' },
      { type: 'tile-select', tile: '-9,1' },
      { type: 'modifier-invoke', modifier: 'move' },
      { type: 'tile-select', tile: '3,-2' },
      { type: 'tile-select', tile: '-9,-1' },
      { type: 'modifier-invoke', modifier: 'move' },
      { type: 'tile-select', tile: '3,-3' },
      { type: 'tile-select', tile: '2,7' },
      { type: 'modifier-invoke', modifier: 'move' },
      { type: 'tile-select', tile: '0,-3' },
      { type: 'modifier-invoke', modifier: 'rotate', options: { button: Button.MIDDLE } },
      { type: 'modifier-invoke', modifier: 'rotate', options: { times: 2 } },
      { type: 'tile-select', tile: '0,0' },
      { type: 'modifier-invoke', modifier: 'rotate', options: { times: 2 } },
      { type: 'wait', for: 'mask-visible' },
      { type: 'tile-click', tile: '-10,2' },
      { type: 'wait', for: 'mask-visible' },
      { type: 'tile-click', tile: '2,-1' },
      { type: 'wait', for: 'mask-hidden' },
      { type: 'modifier-invoke', modifier: 'puzzle' },
      { type: 'wait', for: 'puzzle-loaded' }
    ])

    await puzzle.solve([
      { type: 'tile-select', tile: '0,0' },
      { type: 'modifier-invoke', modifier: 'rotate', options: { times: 2 } },
      { type: 'wait', for: 'mask-visible' },
      { type: 'tile-click', tile: '1,0' },
      { type: 'wait', for: 'mask-hidden' },
      { type: 'tile-select', tile: '1,-1' },
      { type: 'modifier-invoke', modifier: 'rotate', options: { times: 3 } }
    ])

    assert(await puzzle.isSolved())
  })
})

describe('Puzzle 001-011', function () {
  it('should be solved', async function () {
    await puzzle.solve([
      { type: 'continue' },
      { type: 'tile-select', tile: '8,1' },
      { type: 'modifier-invoke', modifier: 'rotate', options: { button: Button.MIDDLE } },
      { type: 'modifier-invoke', modifier: 'rotate' },
      { type: 'tile-select', tile: '3,-3' },
      { type: 'modifier-invoke', modifier: 'move' },
      { type: 'tile-select', tile: '7,0' },
      { type: 'tile-select', tile: '3,-2' },
      { type: 'modifier-invoke', modifier: 'move' },
      { type: 'tile-select', tile: '7,-1' },
      { type: 'tile-select', tile: '0,0' },
      { type: 'modifier-invoke', modifier: 'move' },
      { type: 'tile-select', tile: '-9,1' },
      { type: 'modifier-invoke', modifier: 'rotate', options: { times: 2 } },
      { type: 'tile-select', tile: '0,-3' },
      { type: 'modifier-invoke', modifier: 'move' },
      { type: 'tile-select', tile: '-10,1' },
      { type: 'modifier-invoke', modifier: 'rotate', options: { times: 3 } },
      { type: 'tile-select', tile: '8,1' },
      { type: 'modifier-invoke', modifier: 'toggle' },
      { type: 'wait', for: 'mask-visible' },
      { type: 'tile-click', tile: '-10,2' },
      { type: 'wait', for: 'mask-visible' },
      { type: 'tile-click', tile: '8,-1' },
      { type: 'wait', for: 'mask-hidden' },
      { type: 'modifier-invoke', modifier: 'puzzle' },
      { type: 'wait', for: 'puzzle-loaded' }
    ])

    await puzzle.solve([
      { type: 'tile-select', tile: '-1,-1' },
      { type: 'modifier-invoke', modifier: 'rotate' },
      { type: 'tile-select', tile: '1,-4' },
      { type: 'modifier-invoke', modifier: 'move' },
      { type: 'tile-click', tile: '-2,0' },
      { type: 'tile-select', tile: '1,2' },
      { type: 'modifier-invoke', modifier: 'move' },
      { type: 'tile-select', tile: '-2,-1' },
      { type: 'tile-select', tile: '2,-2' },
      { type: 'modifier-invoke', modifier: 'rotate', options: { times: 3 } },
      { type: 'tile-select', tile: '2,1' },
      { type: 'modifier-invoke', modifier: 'rotate', options: { times: 3 } },
      { type: 'tile-select', tile: '2,-2' },
      { type: 'modifier-invoke', modifier: 'move' },
      { type: 'tile-click', tile: '-1,0' },
      { type: 'tile-select', tile: '2,1' },
      { type: 'modifier-invoke', modifier: 'move' },
      { type: 'tile-click', tile: '-1,-2' },
      { type: 'tile-select', tile: '1,-2' },
      { type: 'modifier-invoke', modifier: 'move' },
      { type: 'tile-click', tile: '0,-1' },
      { type: 'tile-select', tile: '1,0' },
      { type: 'modifier-invoke', modifier: 'move' },
      { type: 'tile-click', tile: '0,0' },
      { type: 'tile-select', tile: '-1,-1' },
      { type: 'modifier-invoke', modifier: 'toggle' },
      { type: 'wait', for: 'mask-visible' },
      { type: 'tile-click', tile: '1,1' },
      { type: 'tile-click', tile: '1,-3' },
      { type: 'tile-click', tile: '1,1' },
      { type: 'tile-click', tile: '1,-3' },
      { type: 'tile-select', tile: '0,-3' },
      { type: 'wait', for: 'mask-hidden' },
      { type: 'modifier-invoke', modifier: 'rotate', options: { times: 2 } },
      { type: 'tile-select', tile: '0,2' },
      { type: 'modifier-invoke', modifier: 'rotate', options: { times: 4 } }
    ])

    assert(await puzzle.isSolved())
  })
})

describe('Puzzle 001', function () {
  it('should be solved', async function () {
    await puzzle.solve([
      { type: 'continue' },
      { type: 'tile-select', tile: '6,-2' },
      { type: 'modifier-invoke', modifier: 'rotate' },
      { type: 'tile-select', tile: '6,2' },
      { type: 'modifier-invoke', modifier: 'rotate' },
      { type: 'tile-select', tile: '-7,-3' },
      { type: 'modifier-invoke', modifier: 'rotate', options: { button: Button.MIDDLE } },
      { type: 'modifier-invoke', modifier: 'rotate' },
      { type: 'tile-select', tile: '8,1' },
      { type: 'modifier-invoke', modifier: 'toggle' },
      { type: 'modifier-invoke', modifier: 'toggle' },
      { type: 'wait', for: 'mask-visible' },
      { type: 'tile-click', tile: '-10,-1' },
      { type: 'wait', for: 'mask-hidden' },
      // Red connected
      { type: 'tile-select', tile: '3,-1' },
      { type: 'modifier-invoke', modifier: 'move' },
      { type: 'tile-select', tile: '0,0' },
      { type: 'modifier-invoke', modifier: 'rotate' },
      { type: 'tile-select', tile: '3,0' },
      { type: 'modifier-invoke', modifier: 'move' },
      { type: 'tile-select', tile: '0,-3' },
      { type: 'wait', for: 'mask-visible' },
      { type: 'tile-click', tile: '7,2' },
      { type: 'wait', for: 'mask-hidden' },
      // Blue connected
      { type: 'tile-select', tile: '1,-1' },
      { type: 'modifier-invoke', modifier: 'toggle' },
      { type: 'tile-select', tile: '4,0' },
      { type: 'modifier-invoke', modifier: 'swap' },
      { type: 'tile-select', tile: '-10,1' },
      { type: 'modifier-invoke', modifier: 'swap' },
      { type: 'tile-select', tile: '-5,2' },
      { type: 'tile-select', tile: '4,0' },
      { type: 'modifier-invoke', modifier: 'rotate' },
      { type: 'wait', for: 'mask-visible' },
      { type: 'tile-click', tile: '2,-1' },
      { type: 'wait', for: 'mask-visible' },
      { type: 'tile-click', tile: '2,1' },
      { type: 'wait', for: 'mask-hidden' },
      { type: 'tile-select', tile: '1,-1' },
      { type: 'modifier-invoke', modifier: 'rotate', options: { times: 3 } },
      { type: 'modifier-invoke', modifier: 'toggle' },
      { type: 'tile-select', tile: '-10,1' },
      { type: 'modifier-invoke', modifier: 'move' },
      { type: 'tile-select', tile: '3,0' },
      { type: 'tile-select', tile: '6,-2' },
      { type: 'modifier-invoke', modifier: 'toggle' },
      { type: 'wait', for: 'mask-visible' },
      { type: 'tile-click', tile: '-10,2' },
      { type: 'wait', for: 'mask-visible' },
      { type: 'tile-click', tile: '2,1' },
      { type: 'wait', for: 'mask-hidden' },
      // First purple connected
      { type: 'tile-select', tile: '1,-1' },
      { type: 'modifier-invoke', modifier: 'rotate', options: { times: 2 } },
      { type: 'tile-select', tile: '-9,1' },
      { type: 'modifier-invoke', modifier: 'move' },
      { type: 'tile-select', tile: '1,0' },
      { type: 'modifier-invoke', modifier: 'rotate', options: { button: Button.MIDDLE } },
      { type: 'modifier-invoke', modifier: 'rotate' }
    ])

    assert(await puzzle.isSolved())
  })
})
