import { Group, Path, Point } from 'paper'
import { EventListeners } from './eventListeners'
import { Interact } from './interact'
import { View } from './view'
import { Puzzle } from './puzzle'
import { State } from './state'
import { arrayMergeOverwrite, debounce, getKeyFactory, merge } from './util'
import { JSONEditor } from '@json-editor/json-editor/src/core'
import { Tile } from './items/tile'
import { Gutter } from './gutter'

const elements = Object.freeze({
  configuration: document.getElementById('editor-configuration'),
  editor: document.getElementById('editor'),
  lock: document.getElementById('editor-lock'),
  puzzle: document.getElementById('puzzle'),
  recenter: document.getElementById('editor-recenter'),
  wrapper: document.getElementById('editor-wrapper')
})

const localStorage = window.localStorage

export class Editor {
  group = new Group({ locked: true })
  id

  #editor
  #eventListener = new EventListeners({ context: this })
  #gutter
  #hover
  #layout
  #puzzle
  #state

  constructor (puzzle, state) {
    this.id = state.getId()

    this.#puzzle = puzzle
    this.#layout = puzzle.layout
    this.#state = state

    this.#eventListener.add([
      { element: elements.configuration, handler: this.#onConfigurationUpdate, type: 'focusout' },
      { element: puzzle.element, handler: this.#onPointerMove, type: 'pointermove' },
      { handler: this.#onPuzzleUpdate, type: Puzzle.Events.Updated },
      { element: elements.recenter, handler: this.#onRecenter, type: 'click' },
      { element: puzzle.element, handler: this.#onTap, type: 'tap' },
      { element: elements.lock, handler: this.#toggleLock, type: 'click' },
      { type: Gutter.Events.Moved, handler: this.#onResize },
      { type: 'resize', element: window, handler: debounce(this.#onResize.bind(this)) }
    ])

    this.#gutter = new Gutter(elements.puzzle, elements.wrapper)

    elements.configuration.value = state.getCurrentJSON()
    this.#updateLock()

    this.group.addChildren(Editor.mark(this.#layout.getCenter(), this.#layout.parameters.circumradius / 4))
    this.#puzzle.layers.edit.addChild(this.group)
  }

  getState () {
    return JSON.parse(elements.configuration.value)
  }

  isLocked () {
    return localStorage.getItem(Editor.#key(Editor.CacheKeys.Locked)) === 'true'
  }

  teardown () {
    this.#gutter.teardown()
    this.#eventListener.remove()
    this.group.remove()

    if (this.#editor) {
      this.#editor.destroy()
    }
  }

  #onConfigurationUpdate () {
    try {
      const state = this.getState()
      if (this.#state.getDiff(state) === undefined) {
        // No changes
        return
      }

      this.#puzzle.addMove()
      // Need to force a reload to make sure the UI is in sync with the state
      this.#puzzle.reload(state)
    } catch (e) {
      // TODO: maybe display something to the user, too
      console.error(e)
    }
  }

  #destroyEditor () {
    this.#editor.destroy()
    this.#editor = undefined
    this.#onConfigurationUpdate()
  }

  #createEditor () {
    const tile = this.#puzzle.selectedTile
    const options = {
      disable_array_delete_all_rows: true,
      disable_array_delete_last_row: true,
      disable_collapse: true,
      disable_edit_json: true,
      disable_properties: true,
      enforce_const: true,
      form_name_root: 'puzzle',
      // There is no support for material icons, so we have to hack it into another icon lib
      iconlib: 'fontawesome3',
      keep_oneof_values: false,
      // Enabling this causes items to not match in anyOf :(
      // no_additional_properties: true,
      prompt_before_delete: false,
      remove_button_labels: true,
      schema: tile ? Tile.Schema : Puzzle.Schema,
      show_opt_in: true,
      startval: tile ? tile.getState() : this.#puzzle.getState(),
      theme: 'barebones'
    }

    console.log(JSON.stringify(options, null, 2))

    this.#editor = new JSONEditor(elements.editor, options)
    this.#editor.on('change', this.#onEditorUpdate.bind(this))
  }

  #onEditorUpdate () {
    const state = this.#puzzle.getState()
    const value = this.#editor.getValue()
    const offset = this.#puzzle.selectedTile?.coordinates.offset

    // Update state
    const newState = merge(
      state,
      offset ? { layout: { tiles: { [offset.r]: { [offset.c]: value } } } } : value,
      { arrayMerge: arrayMergeOverwrite }
    )

    console.log('state', state, 'value', value, 'newState', newState)

    // Update configuration
    elements.configuration.value = JSON.stringify(newState, null, 2)
  }

  #onPointerMove (event) {
    const offset = this.#layout.getOffset(this.#puzzle.getProjectPoint(Interact.point(event)))
    const center = this.#layout.getPoint(offset)
    if (!this.#hover) {
      this.#hover = new Path.RegularPolygon({
        center,
        closed: true,
        radius: this.#layout.parameters.circumradius,
        opacity: 0.2,
        sides: 6,
        style: {
          strokeColor: 'black',
          strokeWidth: 2
        }
      })

      this.group.addChild(this.#hover)
    } else {
      this.#hover.position = center
    }
  }

  #onPuzzleUpdate () {
    elements.configuration.value = this.#state.getCurrentJSON()
  }

  #onRecenter () {
    View.setCenter(this.#layout.getCenter())
  }

  #onResize () {
    // TODO store the pane width in cache via View so it will be sticky
    this.#puzzle.resize()
    this.#onRecenter()
    // For some reason, without reload, setting viewSize alone breaks the project coordinate space, maybe:
    // https://github.com/paperjs/paper.js/issues/1757
    // Forcing a reload fixes it.
    this.#puzzle.reload()
  }

  #onTap (event) {
    // TODO: need to create/destroy editor based on whether a tile is selected
    //  - when unselected, display global editor
    //  - when selected, display tile editor
    if (this.isLocked()) {
      // If tiles are locked, let puzzle handle it
      return
    }

    const offset = this.#layout.getOffset(event.detail.point)
    const tile = this.#puzzle.layout.getTile(offset)

    console.debug('editor.#onTap', offset, tile)

    if (tile) {
      this.#puzzle.layout.removeTile(offset)
    } else {
      this.#puzzle.layout.addTile(offset)
    }

    this.#puzzle.addMove()
    this.#puzzle.updateState()
    this.#puzzle.getBeams().forEach((beam) => {
      // Re-evaluate all the beams
      beam.done = false
    })

    this.#puzzle.update()
  }

  #toggleLock () {
    localStorage.setItem(Editor.#key(Editor.CacheKeys.Locked), (!this.isLocked()).toString())
    this.#updateLock()
  }

  #updateLock () {
    const locked = this.isLocked()
    const icon = elements.lock.firstChild
    icon.textContent = locked ? 'lock' : 'lock_open'
    icon.title = (locked ? 'Unlock' : 'Lock') + ' tiles'
    if (!locked) {
      // De-select any selected tile
      this.#puzzle.updateSelectedTile()
    }
  }

  static mark (center, width) {
    const offset = new Point(width, width).divide(2)
    const square = new Path.Rectangle(center.subtract(offset), width)
    const settings = {
      opacity: 0.5,
      style: {
        strokeCap: 'round',
        strokeColor: 'black',
        strokeJoin: 'round',
        strokeWidth: 2
      }
    }
    return [
      new Path(Object.assign({ segments: [square.segments[0], square.segments[2]] }, settings)),
      new Path(Object.assign({ segments: [square.segments[1], square.segments[3]] }, settings))
    ]
  }

  static #key = getKeyFactory(State.getId(), 'editor')

  static CacheKeys = Object.freeze({
    Locked: 'locked'
  })

  static ClassNames = Object.freeze({
    Edit: 'edit'
  })
}
