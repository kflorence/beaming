import { confirm } from './dialog.js'
import { Puzzle } from './puzzle'
import { Editor } from './editor'
import { debug } from './debug'
import { animate, classToString, emitEvent, params, url } from './util'
import { State } from './state'
import { Storage } from './storage'
import { EventListeners } from './eventListeners'
import { Keys } from '../electron/settings/keys.js'

const elements = Object.freeze({
  delete: document.getElementById('delete'),
  dialog: document.getElementById('dialog-title'),
  edit: document.getElementById('title-editor'),
  play: document.getElementById('title-play'),
  quit: document.getElementById('title-quit'),
  screen: document.getElementById('screen'),
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

  edit () {
    if (!document.body.classList.contains(Game.States.Edit)) {
      this.#reset()
      document.body.classList.add(Game.States.Edit)
      State.setParam(Game.States.Edit, '')
      setTimeout(() => { this.editor.select() })
    }

    Game.dialogClose()
  }

  play () {
    if (!document.body.classList.contains(Game.States.Play)) {
      this.#reset()
      document.body.classList.add(Game.States.Play)
      State.setParam(Game.States.Play, '')

      setTimeout(() => {
        this.editor.teardown()
        this.puzzle.select()
        this.puzzle.resize()
      })
    }

    Game.dialogClose()
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
      Game.dialogClose()
    } else {
      Game.dialogOpen()
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

  static dialogClose () {
    if (elements.dialog.open) {
      animate(elements.screen, 'slide-left-in')
      animate(elements.dialog, 'slide-left-out', () => { elements.dialog.close() })
    }
  }

  static dialogOpen () {
    if (!elements.dialog.open) {
      animate(elements.screen, 'slide-right-out')
      animate(elements.dialog, 'slide-right-in')
      elements.dialog.showModal()
    }
  }

  static toString = classToString('Game')

  static States = Object.freeze({
    Edit: State.ParamKeys.Edit,
    Play: State.ParamKeys.Play
  })

  static states = Object.values(Game.States)
}
