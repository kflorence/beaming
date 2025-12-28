import paper, { Group, Layer, Path, Point } from 'paper'
import { EventListeners } from './eventListeners'
import { Interact } from './interact'
import { View } from './view'
import { Puzzle } from './puzzle'
import { State } from './state'
import { Storage } from './storage'
import { appendOption, classToString, getKeyFactory, uniqueId, url, writeToClipboard } from './util'
import { JSONEditor } from '@json-editor/json-editor/src/core'
import { Tile } from './items/tile'
import { Gutter } from './gutter'
import Tippy from 'tippy.js'
import { Phosphor } from './iconlib.js'

const elements = Object.freeze({
  cancel: document.getElementById('editor-cancel'),
  canvas: document.getElementById('puzzle-canvas'),
  configuration: document.getElementById('editor-configuration'),
  copy: document.getElementById('editor-copy'),
  debug: document.getElementById('debug'),
  dock: document.getElementById('editor-dock'),
  editor: document.getElementById('editor'),
  lock: document.getElementById('editor-lock'),
  new: document.getElementById('editor-new'),
  paste: document.getElementById('editor-paste'),
  play: document.getElementById('editor-play'),
  puzzle: document.getElementById('puzzle'),
  reset: document.getElementById('editor-reset'),
  select: document.getElementById('select'),
  share: document.getElementById('editor-share'),
  update: document.getElementById('editor-update'),
  wrapper: document.getElementById('editor-wrapper')
})

const tippy = Tippy(elements.share, {
  content: 'Share URL copied to clipboard!',
  theme: 'custom',
  trigger: 'manual'
})

// TODO: consider adding AJV validations that ensure unique keys are unique
// See: https://github.com/ajv-validator/ajv-keywords/blob/master/README.md#uniqueitemproperties

// TODO: add ability to move the center marker. wherever it is placed will become the new center of the canvas
// https://github.com/kflorence/beaming/issues/70

// TODO: implement author / description in the UI
// https://github.com/kflorence/beaming/issues/71

export class Editor {
  group = new Group({ locked: true })

  #center = new Group({ locked: true })
  #copy
  #editor
  #editors = {}
  #eventListener = new EventListeners({ context: this })
  #gutter
  #hover
  #layer = new Layer({ name: 'editor' })
  #puzzle

  constructor (puzzle) {
    this.#gutter = new Gutter(elements.puzzle, elements.wrapper)
    this.#puzzle = puzzle
  }

  getId () {
    const tile = this.#puzzle.selectedTile
    return tile ? tile.coordinates.offset.toString() : 'root'
  }

  getState () {
    return JSON.parse(elements.configuration.value)
  }

  getShareUrl () {
    const playUrl = new URL(url)
    playUrl.searchParams.delete(State.ParamKeys.Edit)
    playUrl.searchParams.append(State.ParamKeys.Play, '')
    // Cloning will flatten current state into original state and get rid of history
    playUrl.hash = ['', State.getId(), this.#puzzle.state.clone().encode()].join('/')
    return playUrl.toString()
  }

  isLocked () {
    return Storage.get(Editor.key(State.getId(), Editor.CacheKeys.Locked)) === 'true'
  }

  select (id) {
    this.teardown()
    this.#puzzle.select(id)
    this.#updateDropdown()
    this.setup()
  }

  setup () {
    if (this.#editor) {
      return
    }

    this.#gutter.setup()

    this.#puzzle.resize()

    this.#eventListener.add([
      { type: 'click', element: elements.cancel, handler: this.#onConfigurationCancel },
      { type: 'click', element: elements.copy, handler: this.#onCopy },
      { type: 'click', element: elements.dock, handler: this.#toggleDock },
      { type: 'click', element: elements.lock, handler: this.#toggleLock },
      { type: 'click', element: elements.new, handler: this.#onNew },
      { type: 'click', element: elements.paste, handler: this.#onPaste },
      { type: 'click', element: elements.reset, handler: this.#onReset },
      { type: 'click', element: elements.share, handler: this.#onShare },
      { type: 'click', element: elements.update, handler: this.#onConfigurationUpdate },
      { type: Gutter.Events.Moved, handler: this.#onGutterMoved },
      { type: 'pointermove', handler: this.#onPointerMove },
      { type: Puzzle.Events.Updated, handler: this.#onPuzzleUpdate },
      { type: 'tap', element: this.#puzzle.element, handler: this.#onTap },
      { type: Tile.Events.Deselected, handler: this.#setup },
      { type: Tile.Events.Selected, handler: this.#setup },
      { type: View.Events.Center, handler: this.#onCenter }
    ])

    const state = this.#puzzle.state
    elements.configuration.value = state.getCurrentJSON()

    paper.project.addLayer(this.#layer)

    this.group.addChild(this.#center)
    this.#layer.addChild(this.group)

    this.#updateDock()
    this.#updateLock()
    this.#updateCenter()

    this.#setup()
  }

  teardown () {
    if (!this.#editor) {
      return
    }

    Object.keys(this.#editors).forEach((id) => {
      const editor = this.#editors[id]
      editor.element.remove()
      editor.destroy()
      delete this.#editors[id]
    })

    this.#eventListener.remove()
    this.#gutter.teardown()

    this.group.removeChildren()
    this.group.remove()
    this.#layer.removeChildren()
    this.#layer.remove()

    this.#copy = undefined
    this.#editor = undefined
    this.#hover = undefined
  }

  #onConfigurationCancel () {
    const tile = this.#puzzle.selectedTile
    this.#editor.setValue(tile ? tile.getState() : this.#puzzle.state.getCurrent())
  }

  #onConfigurationUpdate () {
    const state = this.getState()
    // Ensure the configuration is in sync with the editor value
    this.#onEditorUpdate(state)
    const diff = this.#puzzle.state.getDiff(state)
    console.debug(Editor.toString('onConfigurationUpdate'), diff)

    if (diff === undefined) {
      // No changes
      return
    }

    this.#puzzle.state.addMove()

    // Need to force a reload to make sure the UI is in sync with the state
    this.#puzzle.reload(state, this.#onError.bind(this))

    if (diff.title) {
      // Title was changed
      this.#updateDropdown()
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

  #onEditorUpdate (value = this.#editor?.getValue()) {
    if (this.#puzzle.error) {
      // No updates until error is fixed
      return
    }

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

    console.debug(Editor.toString('#onEditorUpdate'), 'current', current, 'new', value, 'updated', state)

    this.#updateConfiguration(state)
  }

  #onError (e) {
    this.#puzzle.onError(e, `Error: "${e.message}". Undo and try again.`)
  }

  #onGutterMoved () {
    this.#puzzle.resize()
    this.#updateCenter()
  }

  #onNew () {
    this.select(uniqueId())
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
    elements.debug.textContent = ''

    if (event.pointerType !== 'mouse') {
      // Only display the hover indicator when using a mouse
      return
    } else if (event.target !== elements.canvas) {
      this.#hover?.remove()
      this.#hover = undefined
      return
    }

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

    elements.debug.textContent = `[${offset.r},${offset.c}]`
  }

  #onPuzzleUpdate () {
    this.#layer.bringToFront()
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
    await writeToClipboard(this.getShareUrl())
    tippy.show()
    setTimeout(() => tippy.hide(), 1000)
  }

  #onTap (event) {
    if (this.isLocked()) {
      // If tiles are locked, let puzzle handle it
      return this.#puzzle.tap(event)
    }

    const layout = this.#puzzle.layout
    const offset = layout.getOffset(event.detail.point)
    const tile = layout.getTile(offset)

    console.debug(Editor.toString('#onTap'), offset, tile)

    if (tile) {
      if (tile.ref) {
        console.debug(Editor.toString('#onTap'), 'Ignoring removal of imported tile.')
        return
      }

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
    const id = this.getId()

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
      const activeId = this.#editor.element.dataset.tile ?? 'root'
      console.debug(Editor.toString('#setup'), `De-activating editor: ${activeId}`)
      this.#editor.off('change')
      this.#editor.element.classList.add('hide')
    }

    if (this.#editors[id]) {
      console.debug(Editor.toString('#setup'), `Activating editor: ${id}`)
      this.#editor = this.#editors[id]
    } else {
      console.debug(Editor.toString('#setup'), `Creating editor: ${id}`)
      const options = {
        disable_array_delete_all_rows: true,
        disable_array_delete_last_row: true,
        disable_collapse: true,
        disable_edit_json: true,
        disable_properties: true,
        enforce_const: true,
        form_name_root: 'puzzle',
        iconlib: Phosphor.Name,
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

      const element = document.createElement('div')
      if (tile) {
        element.dataset.tile = id
      }

      elements.editor.append(element)

      console.debug(Editor.toString('#setup'), JSON.stringify(options, null, 2))
      this.#editor = this.#editors[id] = new JSONEditor(element, options)
    }

    this.#editor.on('change', this.#onEditorUpdate.bind(this))
    this.#editor.element.classList.remove('hide')
  }

  #toggleDock () {
    this.#gutter.toggleOrientation()
    this.#updateDock()
  }

  #toggleLock () {
    Storage.set(Editor.key(State.getId(), Editor.CacheKeys.Locked), (!this.isLocked()).toString())
    this.#updateLock()
  }

  #updateCenter () {
    if (!this.#puzzle.layout) {
      return
    }

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

  #updateDock () {
    const icon = elements.dock.firstChild
    if (this.#gutter.horizontal) {
      icon.title = 'Dock to right'
      icon.className = 'ph-bold ph-square-split-horizontal'
    } else {
      icon.title = 'Dock to bottom'
      icon.className = 'ph-bold ph-square-split-vertical'
    }
  }

  #updateDropdown () {
    elements.select.replaceChildren()

    State.getIds().forEach((id) => {
      appendOption(elements.select, { value: id, text: State.fromCache(id)?.getTitle() || id })
    })

    // Select current ID
    elements.select.value = this.#puzzle.state.getId()
  }

  #updateLock () {
    const locked = this.isLocked()
    const icon = elements.lock.firstChild
    icon.className = 'ph-bold ph-' + (locked ? 'lock' : 'lock-open')
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

  static toString = classToString('Editor')

  static CacheKeys = Object.freeze({
    Locked: 'locked'
  })

  static key = getKeyFactory(State.CacheKeys.Edit, 'editor')
}
