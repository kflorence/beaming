import paper, { Group, Layer, Path, Point } from 'paper'
import { EventListeners } from './eventListeners'
import { Interact } from './interact'
import { View } from './view'
import { Puzzle } from './puzzle'
import { State } from './state'
import { getKeyFactory, url, writeToClipboard } from './util'
import { JSONEditor } from '@json-editor/json-editor/src/core'
import { Tile } from './items/tile'
import { Gutter } from './gutter'
import Tippy from 'tippy.js'
import 'tippy.js/dist/tippy.css'

const elements = Object.freeze({
  cancel: document.getElementById('editor-cancel'),
  configuration: document.getElementById('editor-configuration'),
  copy: document.getElementById('editor-copy'),
  dock: document.getElementById('editor-dock'),
  editor: document.getElementById('editor'),
  lock: document.getElementById('editor-lock'),
  paste: document.getElementById('editor-paste'),
  play: document.getElementById('editor-play'),
  puzzle: document.getElementById('puzzle'),
  reset: document.getElementById('editor-reset'),
  share: document.getElementById('editor-share'),
  update: document.getElementById('editor-update'),
  wrapper: document.getElementById('editor-wrapper')
})

const localStorage = window.localStorage

const tippy = Tippy(elements.share, {
  content: 'Share URL copied to clipboard!',
  theme: 'custom',
  trigger: 'manual'
})

// TODO: consider adding AJV validations that ensure unique keys are unique
// See: https://github.com/ajv-validator/ajv-keywords/blob/master/README.md#uniqueitemproperties

export class Editor {
  group = new Group({ locked: true })
  id

  #center = new Group({ locked: true })
  #copy
  #editor
  #eventListener = new EventListeners({ context: this })
  #gutter
  #hover
  #layer
  #puzzle

  constructor (puzzle) {
    document.body.classList.add(Editor.ClassNames.Edit)

    this.#gutter = new Gutter(elements.puzzle, elements.wrapper)
    this.#layer = new Layer()
    this.#puzzle = puzzle

    // Place this layer under all the other ones
    paper.project.insertLayer(0, this.#layer)
  }

  getState () {
    return JSON.parse(elements.configuration.value)
  }

  getShareUrl () {
    const playUrl = new URL(url)
    playUrl.searchParams.delete(State.ParamKeys.Edit)
    playUrl.hash = ['', State.getId(), this.#puzzle.state.clone().encode()].join('/')
    return playUrl.toString()
  }

  isLocked () {
    return localStorage.getItem(Editor.#key(Editor.CacheKeys.Locked)) === 'true'
  }

  setup () {
    if (this.#editor) {
      return
    }

    const state = this.#puzzle.state

    this.id = state.getId()

    this.#eventListener.add([
      { type: 'click', element: elements.cancel, handler: this.#onConfigurationCancel },
      { type: 'click', element: elements.copy, handler: this.#onCopy },
      { type: 'click', element: elements.dock, handler: this.#onDockUpdate },
      { type: 'click', element: elements.lock, handler: this.#toggleLock },
      { type: 'click', element: elements.paste, handler: this.#onPaste },
      { type: 'click', element: elements.reset, handler: this.#onReset },
      { type: 'click', element: elements.share, handler: this.#onShare },
      { type: 'click', element: elements.update, handler: this.#onConfigurationUpdate },
      { type: Gutter.Events.Moved, handler: this.#onGutterMoved },
      { type: 'pointermove', element: this.#puzzle.element, handler: this.#onPointerMove },
      { type: Puzzle.Events.Updated, handler: this.#onPuzzleUpdate },
      { type: 'tap', element: this.#puzzle.element, handler: this.#onTap },
      { type: Tile.Events.Deselected, handler: this.#setup },
      { type: Tile.Events.Selected, handler: this.#setup },
      { type: View.Events.Center, handler: this.#onCenter }
    ])

    elements.configuration.value = state.getCurrentJSON()

    this.group.addChild(this.#center)
    this.#layer.addChild(this.group)

    this.#updateLock()
    this.#updateCenter()

    this.#setup()
  }

  #onConfigurationCancel () {
    const tile = this.#puzzle.selectedTile
    this.#editor.setValue(tile ? tile.getState() : this.#puzzle.state.getCurrent())
  }

  #onConfigurationUpdate () {
    try {
      const state = this.getState()
      const diff = this.#puzzle.state.getDiff(state)
      console.debug('onConfigurationUpdate', diff)

      if (diff === undefined) {
        // No changes
        return
      }

      this.#puzzle.state.addMove()
      // Need to force a reload to make sure the UI is in sync with the state
      this.#puzzle.reload(state)
    } catch (e) {
      // TODO: maybe display something to the user, too
      console.error(e)
    }
  }

  #onCenter () {
    this.#updateCenter()
  }

  #onCopy () {
    if (elements.copy.classList.contains('disabled')) {
      return
    }

    this.#puzzle.layout.getTile(this.#copy)?.setStyle('default')
    this.#copy = this.#puzzle.selectedTile.coordinates.offset
    this.#puzzle.layout.getTile(this.#copy).setStyle('copy')
  }

  #onDockUpdate () {
    const icon = elements.dock.firstChild
    const isDockBottom = this.#gutter.toggleOrientation()

    if (isDockBottom) {
      icon.title = 'Dock to right'
      icon.textContent = 'dock_to_right'
    } else {
      icon.title = 'Dock to bottom'
      icon.textContent = 'dock_to_bottom'
    }

    this.#onGutterMoved()
  }

  #onEditorUpdate (value = this.#editor.getValue()) {
    const current = this.#puzzle.state.getCurrent()
    const offset = this.#puzzle.selectedTile?.coordinates.offset

    let state
    if (offset) {
      // Update a specific tile
      state = current
      state.layout.tiles[offset.r][offset.c] = value
    } else {
      // Update the entire state
      state = value
      // Tiles are not editable globally
      state.layout.tiles = current.layout.tiles
    }

    console.debug('current', current, 'new', value, 'updated', state)

    this.#updateConfiguration(state)
  }

  #onGutterMoved () {
    this.#puzzle.resize()
  }

  #onPaste () {
    if (elements.paste.classList.contains('disabled')) {
      return
    }

    const value = JSON.parse(JSON.stringify(
      this.#puzzle.layout.getTile(this.#copy).getState(),
      // Remove 'id' keys
      (k, v) => k === 'id' ? undefined : v)
    )

    this.#onEditorUpdate(value)
    this.#onConfigurationUpdate()
  }

  #onPointerMove (event) {
    const layout = this.#puzzle.layout
    const offset = layout.getOffset(this.#puzzle.getProjectPoint(Interact.point(event)))
    const center = layout.getPoint(offset)
    if (!this.#hover) {
      this.#hover = new Path.RegularPolygon({
        center,
        closed: true,
        radius: layout.parameters.circumradius,
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
    elements.configuration.value = this.#puzzle.state.getCurrentJSON()
    this.#updatePlayUrl()
  }

  #onReset () {
    if (elements.reset.classList.contains('disabled')) {
      return
    }

    const value = JSON.parse(JSON.stringify(
      this.#puzzle.selectedTile.getState(),
      // Remove matching keys
      (k, v) => ['items', 'modifiers'].includes(k) ? undefined : v)
    )

    this.#onEditorUpdate(value)
    this.#onConfigurationUpdate()
  }

  async #onShare () {
    await writeToClipboard(`Beaming: try out my custom puzzle! ${this.getShareUrl()}`)
    tippy.show()
    setTimeout(() => tippy.hide(), 1000)
  }

  #onTap (event) {
    if (this.isLocked()) {
      // If tiles are locked, let puzzle handle it
      return
    }

    const layout = this.#puzzle.layout
    const offset = layout.getOffset(event.detail.point)
    const tile = layout.getTile(offset)

    console.debug('editor.#onTap', offset, tile)

    if (tile) {
      layout.removeTile(offset)
    } else {
      layout.addTile(offset)
    }

    this.#puzzle.state.addMove()
    this.#puzzle.updateState()

    // TODO: adding/removing tiles would ideally not require a reload. but getting rid of it would require fixing
    //  some bugs related to the beam
    this.#puzzle.reload()
  }

  #setup (event) {
    const tile = this.#puzzle.selectedTile

    // Enable/disable the following actions based on whether a tile is selected
    elements.copy.classList.toggle('disabled', !tile)
    elements.reset.classList.toggle('disabled', !tile)
    elements.paste.classList.toggle('disabled', !(tile && this.#copy))

    if (event?.type === Tile.Events.Selected && event.detail.deselectedTile) {
      // Don't process select events any further if a tile was also de-selected.
      // This prevents a race condition between editor destruction and creation when switching between tiles.
      return
    }

    if (this.#copy && !tile) {
      // Remove the copied tile if no tile is selected
      this.#puzzle.layout.getTile(this.#copy).setStyle('default')
      this.#copy = undefined
    }

    if (this.#copy && !this.#copy.equals(tile?.coordinates.offset)) {
      // If the copied tile is not selected, show it as copied
      this.#puzzle.layout.getTile(this.#copy).setStyle('copy')
    }

    if (this.#editor) {
      this.#editor.destroy()
    }

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
      startval: tile ? tile.getState() : this.#puzzle.state.getCurrent(),
      theme: 'barebones'
    }

    console.debug('Editor options', JSON.stringify(options, null, 2))

    this.#editor = new JSONEditor(elements.editor, options)
    this.#editor.on('change', this.#onEditorUpdate.bind(this))
  }

  #toggleLock () {
    localStorage.setItem(Editor.#key(Editor.CacheKeys.Locked), (!this.isLocked()).toString())
    this.#updateLock()
  }

  #updateCenter () {
    this.#center.removeChildren()
    this.#center.addChildren(Editor.mark(
      this.#puzzle.layout.getCenter(),
      this.#puzzle.layout.parameters.circumradius / 4
    ))
  }

  #updateConfiguration (state) {
    elements.configuration.value = JSON.stringify(state, null, 2)
    this.#updatePlayUrl()
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

  #updatePlayUrl () {
    elements.play.firstElementChild.setAttribute('href', this.getShareUrl())
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

  static CacheKeys = Object.freeze({
    Locked: 'locked'
  })

  static ClassNames = Object.freeze({
    Edit: 'edit'
  })

  static #key = getKeyFactory(State.CacheKeys.Editor, State.getId())
}
