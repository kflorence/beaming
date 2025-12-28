import { confirm } from './dialog.js'
import { Puzzle } from './puzzle'
import { Editor } from './editor'
import paper from 'paper'
import { debug } from './debug'
import { classToString, emitEvent, params, url } from './util'
import { State } from './state'
import { Storage } from './storage'
import { EventListeners } from './eventListeners'
import { Keys } from '../electron/settings/keys.js'

const elements = Object.freeze({
  back: document.getElementById('back'),
  delete: document.getElementById('delete'),
  dialog: document.getElementById('dialog-title'),
  edit: document.getElementById('title-editor'),
  play: document.getElementById('title-play'),
  quit: document.getElementById('title-quit'),
  select: document.getElementById('select'),
  title: document.getElementById('title')
})

export class Game {
  editor
  puzzle

  #eventListeners = new EventListeners({ context: this })

  constructor () {
    this.puzzle = new Puzzle()
    this.editor = new Editor(this.puzzle)

    this.#eventListeners.add([
      { type: 'change', element: elements.select, handler: this.#onSelect },
      { type: 'click', element: elements.back, handler: this.back },
      { type: 'click', element: elements.delete, handler: this.#onDelete },
      { type: 'click', element: elements.edit, handler: this.edit },
      { type: 'click', element: elements.play, handler: this.play },
      { type: 'click', element: elements.quit, handler: this.quit },
      { type: 'click', element: elements.title, handler: this.title },
      { type: Keys.cacheClear, handler: this.#onSettingsCacheClear },
      { type: Storage.Events.Delete, handler: this.#onStorageDelete },
      { type: Storage.Events.Set, handler: this.#onStorageSet }
    ])

    if (params.has(Game.States.Play)) {
      this.play()
    } else if (params.has(Game.States.Edit)) {
      this.edit()
    } else {
      elements.dialog.showModal()
    }
  }

  back () {
    // TODO go back to previous puzzle
  }

  edit () {
    if (document.body.classList.contains(Game.States.Edit)) {
      elements.dialog.close()
      return
    } else if (document.body.classList.contains(Game.States.Play)) {
      this.#reset()
    }

    document.body.classList.add(Game.States.Edit)

    State.setParam(Game.States.Edit, '')

    this.editor.select()

    elements.dialog.close()
  }

  play () {
    if (document.body.classList.contains(Game.States.Play)) {
      elements.dialog.close()
      return
    } else if (document.body.classList.contains(Game.States.Edit)) {
      this.#reset()
    }

    State.setParam(Game.States.Play, '')

    this.editor.teardown()
    this.puzzle.select()
    this.puzzle.resize()

    document.body.classList.add(Game.States.Play)
    elements.dialog.close()
  }

  quit () {
    window.electron?.quit()
  }

  select (id) {
    if (params.has(Game.States.Play)) {
      this.puzzle.select(id)
    } else if (params.has(Game.States.Edit)) {
      this.editor.select(id)
    }
  }

  title () {
    if (elements.dialog.open) {
      elements.dialog.close()
    } else {
      elements.dialog.showModal()
    }
  }

  #onDelete () {
    confirm('Are you sure you want to remove this puzzle? This cannot be undone.', () => {
      const ids = State.delete(this.puzzle.state.getId())
      this.select(ids[ids.length - 1])
    })
  }

  #onSelect (event) {
    this.select(event.target.value)
  }

  async #onSettingsCacheClear (event) {
    console.debug(Game.toString(event.type))
    url.hash = ''
    window.localStorage.clear()
    await window.electron?.store.delete()
    this.puzzle.select()
    emitEvent(Keys.cacheCleared)
  }

  #onStorageDelete (event) {
    console.debug(Game.toString(event.type), event.detail)

    if (event.detail.persist === false) {
      console.debug(Game.toString(event.type), 'Ignoring')
      return
    }

    window.electron?.store.delete(event.detail.key)
  }

  #onStorageSet (event) {
    console.debug(Game.toString(event.type), event.detail)

    if (event.detail.persist === false) {
      console.debug(Game.toString(event.type), 'Ignoring')
      return
    }

    window.electron?.store.set(event.detail.key, event.detail.value)
  }

  #reset () {
    elements.select.replaceChildren()
    // Don't carry state via URL from one context to another
    url.hash = ''
    Game.states.forEach((state) => params.delete(state))
    document.body.classList.remove(...Game.states)
  }

  static debug = debug
  static paper = paper
  static toString = classToString('Game')

  static States = Object.freeze({
    Edit: State.ParamKeys.Edit,
    Play: State.ParamKeys.Play
  })

  static states = Object.values(Game.States)
}
