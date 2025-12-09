import { Puzzle } from './puzzle'
import { Editor } from './editor'
import paper from 'paper'
import { debug } from './debug'
import { params, url } from './util'
import { State } from './state'
import { Storage } from './storage'
import { EventListeners } from './eventListeners'

const elements = Object.freeze({
  back: document.getElementById('back'),
  edit: document.getElementById('title-editor'),
  play: document.getElementById('title-play'),
  quit: document.getElementById('title-quit'),
  title: document.getElementById('dialog-title')
})

export class Game {
  editor
  puzzle

  #eventListeners = new EventListeners({ context: this })

  constructor () {
    this.puzzle = new Puzzle()
    this.editor = new Editor(this.puzzle)

    this.#eventListeners.add([
      { type: 'click', element: elements.back, handler: this.back },
      { type: 'click', element: elements.edit, handler: this.edit },
      { type: 'click', element: elements.play, handler: this.play },
      { type: 'click', element: elements.quit, handler: this.quit },
      { type: Storage.Events.Delete, handler: this.#onStorageDelete },
      { type: Storage.Events.Set, handler: this.#onStorageSet }
    ])

    if (params.has(Game.States.Play)) {
      this.play()
    } else if (params.has(Game.States.Edit)) {
      this.edit()
    } else {
      elements.title.showModal()
    }
  }

  back () {
    if (elements.title.open) {
      elements.title.close()
    } else {
      elements.title.showModal()
    }
  }

  edit () {
    if (document.body.classList.contains(Game.States.Edit)) {
      elements.title.close()
      return
    } else if (document.body.classList.contains(Game.States.Play)) {
      this.#reset()
    }

    document.body.classList.add(Game.States.Edit)

    State.setParam(Game.States.Edit, '')

    this.puzzle.select()
    this.editor.setup()

    elements.title.close()
  }

  play () {
    if (document.body.classList.contains(Game.States.Play)) {
      elements.title.close()
      return
    } else if (document.body.classList.contains(Game.States.Edit)) {
      this.#reset()
    }

    State.setParam(Game.States.Play, '')

    this.editor.teardown()
    this.puzzle.select()
    this.puzzle.resize()

    document.body.classList.add(Game.States.Play)
    elements.title.close()
  }

  quit () {
    window.electron?.quit()
  }

  #onStorageDelete (event) {
    if (event.detail.persist === false) {
      console.debug(Game.toString(), '#onStorageDelete', `Ignoring event '${event.type}'`, event.detail)
      return
    }

    window.electron?.store.delete(event.detail.key).then(_ => {
      console.debug(Game.toString(), '#onStorageDelete', event.type, event.detail)
    })
  }

  #onStorageSet (event) {
    if (event.detail.persist === false) {
      console.debug(Game.toString(), '#onStorageSet', `Ignoring event '${event.type}'`, event.detail)
      return
    }

    window.electron?.store.set(event.detail.key, event.detail.value).then(_ => {
      console.debug(Game.toString(), '#onStorageSet', event.type, event.detail)
    })
  }

  #reset () {
    // Don't carry state via URL from one context to another
    url.hash = ''
    Game.states.forEach((state) => params.delete(state))
    document.body.classList.remove(...Game.states)
  }

  static debug = debug
  static paper = paper
  static toString () {
    return 'Game'
  }

  static States = Object.freeze({
    Edit: State.ParamKeys.Edit,
    Play: State.ParamKeys.Play
  })

  static states = Object.values(Game.States)
}
