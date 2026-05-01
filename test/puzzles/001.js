/* eslint-env mocha */
import { PuzzleFixture } from '../fixtures.js'
import assert from 'assert'
import { Button } from 'selenium-webdriver'

const solutions = {
  '002': [
    { type: 'tile-select', tile: '1,-1' },
    { type: 'modifier-invoke', modifier: 'toggle' },
    { type: 'tile-select', tile: '0,-1' },
    { type: 'modifier-invoke', modifier: 'toggle' },
    { type: 'tile-select', tile: '1,0' },
    { type: 'modifier-invoke', modifier: 'toggle' }
  ],
  '003': [
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
  ],
  '004': [
    { type: 'tile-select', tile: '-1,-1' },
    { type: 'modifier-invoke', modifier: 'rotate', options: { times: 3 } },
    { type: 'tile-select', tile: '1,-1' },
    { type: 'modifier-invoke', modifier: 'swap' },
    { type: 'tile-click', tile: '-1,-1' }
  ],
  '005': [
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
  ],
  '006': [
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
  ]
}

describe('Puzzle 001', function () {
  // This test needs more time
  this.timeout(60000)

  const puzzle = new PuzzleFixture('001')

  after(puzzle.after)
  before(puzzle.before)

  it('should be solved', async function () {
    await puzzle.solve([
      [
        { type: 'tile-select', tile: '1,-1' },
        { type: 'modifier-invoke', modifier: 'toggle' },
        { type: 'modifier-invoke', modifier: 'puzzle' },
        { type: 'wait', for: 'puzzle-loaded' }
      ],
      solutions['002'],
      [
        { type: 'continue' },
        { type: 'tile-select', tile: '-1,-2' },
        { type: 'modifier-invoke', modifier: 'rotate', options: { times: 3 } },
        { type: 'tile-select', tile: '1,-1' },
        { type: 'modifier-invoke', modifier: 'rotate' },
        { type: 'modifier-invoke', modifier: 'toggle' },
        { type: 'modifier-invoke', modifier: 'puzzle' },
        { type: 'wait', for: 'puzzle-loaded' }
      ],
      solutions['003'],
      [
        { type: 'continue' },
        { type: 'tile-select', tile: '-5,0' },
        { type: 'modifier-invoke', modifier: 'swap' },
        { type: 'tile-select', tile: '-4,0' },
        { type: 'tile-select', tile: '-1,-2' },
        { type: 'modifier-invoke', modifier: 'rotate', options: { times: 3 } },
        { type: 'modifier-invoke', modifier: 'puzzle' },
        { type: 'wait', for: 'puzzle-loaded' }
      ],
      solutions['004'],
      [
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
      ],
      solutions['005'],
      [
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
      ],
      solutions['006'],
      [
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
      ]
    ].flat())

    assert(await puzzle.isSolved())
  })
})
