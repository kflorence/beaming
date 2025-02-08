import { Group, Path, Point } from 'paper'
import { EventListeners } from './eventListeners'
import { Interact } from './interact'
import { View } from './view'
import { Puzzle } from './puzzle'
import { State } from './state'
import { getKeyFactory } from './util'

const elements = Object.freeze({
  configuration: document.getElementById('configuration'),
  dialog: document.getElementById('dialog-settings'),
  editor: document.getElementById('puzzle-editor'),
  lock: document.getElementById('lock'),
  recenter: document.getElementById('recenter')
})

const localStorage = window.localStorage

export class Editor {
  group = new Group({ locked: true })
  id

  #editor
  #eventListener = new EventListeners({ context: this })
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
      { element: elements.dialog, handler: this.#onDialogClose, type: 'close' },
      { element: elements.dialog, handler: this.#onDialogOpen, type: 'open' },
      { element: puzzle.element, handler: this.#onPointerMove, type: 'pointermove' },
      { handler: this.#onPuzzleUpdate, type: Puzzle.Events.Updated },
      { element: elements.recenter, handler: this.#onRecenter, type: 'click' },
      { element: puzzle.element, handler: this.#onTap, type: 'tap' },
      { element: elements.lock, handler: this.#toggleLock, type: 'click' }
    ])

    document.body.classList.add(Editor.ClassNames.Edit)
    elements.configuration.value = state.getCurrentJSON()
    this.#updateLock()

    this.group.addChildren(Editor.mark(this.#layout.getCenter(), this.#layout.parameters.circumradius / 4))
    this.#puzzle.layers.edit.addChild(this.group)
  }

  isLocked () {
    return localStorage.getItem(Editor.#key(Editor.CacheKeys.Locked)) === 'true'
  }

  teardown () {
    this.#eventListener.remove()
    this.group.removeChildren()
  }

  #onConfigurationUpdate () {
    try {
      const state = JSON.parse(elements.configuration.value)
      this.#puzzle.addMove()
      // Need to force a reload to make sure the UI is in sync with the state
      this.#puzzle.reload(state)
    } catch (e) {
      // TODO: maybe display something to the user, too
      console.error(e)
    }
  }

  #onDialogClose (event) {
    // TODO destroy json editor
    console.log(event)
  }

  #onDialogOpen (event) {
    // TODO set up json editor
    console.log(event)
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

  #onTap (event) {
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
