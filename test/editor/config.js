/* eslint-env mocha */
import { PuzzleFixture, removeKeys } from '../fixtures.js'
import assert from 'assert'

describe('Editor', function () {
  const puzzle = new PuzzleFixture('config', 'edit')

  after(puzzle.after)
  before(puzzle.before)

  it('should produce matching configuration', async function () {
    await puzzle.clickElement('#edit-new')
    await puzzle.isLoaded()
    await puzzle.clickAtOffset(0, 0)
    await puzzle.clickElement('#editor-lock')
    await puzzle.clickAtOffset(0, 0)
    await puzzle.clickElement('div[data-schemapath="puzzle.items"] .json-editor-opt-in')
    await puzzle.clickElement('div[data-schemapath="puzzle.items"] .json-editor-btn-add')
    await puzzle.selectOption('div[data-schemapath="puzzle.items.0"] .je-switcher', 'portal')
    await puzzle.clickElement('#editor-update')

    const state = removeKeys(await puzzle.getEditorState(), 'id')

    assert.deepStrictEqual(state, {
      layout: {
        offset: 'odd-row',
        tiles: {
          0: {
            0: {
              type: 'tile',
              items: [
                {
                  type: 'portal'
                }
              ]
            }
          }
        }
      },
      unlocked: true
    })
  })
})
