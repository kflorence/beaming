import paper, { Group, Layer, Path, Point } from 'paper'
import { EventListeners } from './eventListeners'
import { Interact } from './interact'
import { View } from './view'
import { Puzzle } from './puzzle'
import { State } from './state'
import { arrayMergeOverwrite, getKeyFactory, merge, url } from './util'
import { JSONEditor } from '@json-editor/json-editor/src/core'
import { Tile } from './items/tile'
import { Gutter } from './gutter'

const elements = Object.freeze({
  cancel: document.getElementById('editor-cancel'),
  configuration: document.getElementById('editor-configuration'),
  dock: document.getElementById('editor-dock'),
  editor: document.getElementById('editor'),
  lock: document.getElementById('editor-lock'),
  play: document.getElementById('editor-play'),
  puzzle: document.getElementById('puzzle'),
  update: document.getElementById('editor-update'),
  wrapper: document.getElementById('editor-wrapper')
})

const localStorage = window.localStorage

export class Editor {
  group = new Group({ locked: true })
  id

  #center = new Group({ locked: true })
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
      { type: 'click', element: elements.dock, handler: this.#onDockUpdate },
      { type: 'click', element: elements.lock, handler: this.#toggleLock },
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
      if (this.#puzzle.state.getDiff(state) === undefined) {
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

  #onCenter () {
    this.#updateCenter()
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

  #onEditorUpdate () {
    const state = this.#puzzle.state.getCurrent()
    const value = this.#editor.getValue()
    const offset = this.#puzzle.selectedTile?.coordinates.offset

    // Update state
    const newState = merge(
      state,
      offset ? { layout: { tiles: { [offset.r]: { [offset.c]: value } } } } : value,
      { arrayMerge: arrayMergeOverwrite }
    )

    console.debug('state', state, 'value', value, 'newState', newState)

    this.#updateConfiguration(newState)
  }

  #onGutterMoved () {
    this.#puzzle.resize()
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

    this.#puzzle.addMove()
    this.#puzzle.updateState()
    this.#puzzle.getBeams().forEach((beam) => {
      // Re-evaluate all the beams
      beam.done = false
    })

    this.#puzzle.update()
  }

  #setup (event) {
    if (event?.type === Tile.Events.Selected && event.detail.deselectedTile) {
      // This prevents a race condition between editor destruction and creation when switching between tiles.
      return
    }

    const tile = this.#puzzle.selectedTile

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

    console.log(JSON.stringify(options, null, 2))

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
    const playUrl = new URL(url)
    playUrl.searchParams.delete(State.ParamKeys.Edit)
    const state = this.#puzzle.state.clone()
    console.log(state)
    playUrl.hash = ['', State.getId(), state.encode()].join('/')
    elements.play.firstElementChild.setAttribute('href', playUrl.toString())
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
