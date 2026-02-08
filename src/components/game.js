import { confirm } from './dialog.js'
import { Puzzle } from './puzzle'
import { Editor } from './editor'
import { debug } from './debug'
import { animate, classToString, emitEvent, params, url } from './util'
import { State } from './state'
import { Storage } from './storage'
import { EventListeners } from './eventListeners'
import { View } from './view.js'
import { Events } from './settings/cache.js'
import { Packs, Puzzles } from '../puzzles/index.js'

const elements = Object.freeze({
  back: document.getElementById('back'),
  delete: document.getElementById('delete'),
  dialogPlay: document.getElementById('dialog-play'),
  dialogTitle: document.getElementById('dialog-title'),
  edit: document.getElementById('title-editor'),
  play: document.getElementById('play'),
  puzzles: document.getElementById('play-puzzles'),
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
      // { type: 'change', element: elements.select, handler: this.#onSelect },
      { type: 'click', element: elements.back, handler: this.#onBack },
      // { type: 'click', element: elements.delete, handler: this.#onDelete },
      { type: 'click', element: elements.edit, handler: this.edit },
      // { type: 'click', element: elements.play, handler: this.play },
      { type: 'click', element: elements.quit, handler: this.quit },
      { type: 'click', element: elements.title, handler: this.title },
      { type: Events.CacheClear, handler: this.#onSettingsCacheClear },
      { type: Storage.Events.Delete, handler: this.#onStorageDelete },
      { type: Storage.Events.Set, handler: this.#onStorageSet }
    ])

    this.updatePuzzles()

    if (Game.is(Game.States.Play)) {
      // noinspection JSIgnoredPromiseFromCall
      this.play()
    } else if (Game.is(Game.States.Edit)) {
      // noinspection JSIgnoredPromiseFromCall
      this.edit()
    } else {
      elements.dialogTitle.showModal()
    }
  }

  async edit () {
    if (!document.body.classList.contains(Game.States.Edit)) {
      this.#reset(Game.States.Edit)
      this.puzzle.teardown()
      await this.editor.select({ animations: [Puzzle.Animations.FadeIn] })
    }

    await Game.dialogClose(elements.dialogTitle)
  }

  async play () {
    if (!document.body.classList.contains(Game.States.Play)) {
      this.#reset(Game.States.Play)
      this.editor.teardown()
      this.puzzle.teardown()
      await this.puzzle.select({ animations: [Puzzle.Animations.FadeIn] })
    }

    await Game.dialogClose(elements.dialogPlay)
  }

  quit () {
    window.electron?.quit()
  }

  async select (id, options) {
    if (Game.is(Game.States.Play)) {
      await this.puzzle.select(id, options)
    } else if (Game.is(Game.States.Edit)) {
      await this.editor.select(id, options)
    }
  }

  async title () {
    if (elements.dialogTitle.open) {
      await Game.dialogClose(elements.dialogTitle)
    } else {
      await Game.dialogOpen(elements.dialogTitle)
    }
  }

  updatePuzzles () {
    elements.puzzles.replaceChildren()

    Object.entries(Packs.titles).forEach(([id, title]) => {
      const li = document.createElement('li')
      li.classList.add('puzzle')
      li.classList.toggle('selected', id === State.getId())
      li.dataset.id = id

      const span = document.createElement('span')
      span.classList.add('title')
      span.textContent = title
      li.append(span)

      const ul = document.createElement('ul')
      ul.classList.add('imports')

      const pack = Packs.get(id)
      pack.layout.imports.forEach((ref) => {
        const state = State.fromCache(ref.id)
        const li = document.createElement('li')
        li.classList.toggle('unlocked', state !== undefined)
        li.dataset.id = ref.id
        li.textContent = Puzzles.titles[ref.id]
        ul.append(li)
      })

      li.append(ul)

      elements.puzzles.append(li)
    })
  }

  async #onBack () {
    const currentId = this.puzzle.state.getId()
    const parentId = params.get(State.CacheKeys.Parent)

    if (parentId !== null && currentId !== parentId) {
      // Go back to parent puzzle
      View.setZoom(1)
      this.puzzle.centerOnTile(0, 0)
      this.select(parentId, { animations: [Puzzle.Animations.FadeIn] })
    } else {
      Game.dialogOpen(elements.dialogPlay)
    }
  }

  #onDelete () {
    confirm('Are you sure you want to remove this puzzle? This cannot be undone.', async () => {
      const ids = State.delete(this.puzzle.state.getId())
      await this.select(ids[ids.length - 1])
    })
  }

  async #onSelect (event) {
    await this.select(event.target.value, {
      animations: [Puzzle.Animations.FadeIn, Puzzle.Animations.FadeOutBefore]
    })
  }

  async #onSettingsCacheClear (event) {
    console.debug(Game.toString(event.type))
    url.hash = ''
    window.localStorage.clear()
    await window.electron?.store.delete()
    await this.puzzle.select()
    emitEvent(Events.CacheCleared)
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

  #reset (state) {
    if (!state) {
      throw new Error('Cannot reset to unknown state.')
    }

    document.body.classList.remove(...Game.states)
    document.body.classList.add(state)

    if (!params.has(state)) {
      Game.states.forEach((state) => params.delete(state))
      params.set(state, '')

      // Don't carry state via URL from one context to another
      url.hash = ''
    }
  }

  static debug = debug

  static async dialogClose (dialog) {
    if (dialog.open) {
      await Promise.all([
        animate(elements.screen, 'slide-left-in'),
        animate(dialog, 'slide-left-out', () => { dialog.close() })
      ])
    }
  }

  static async dialogOpen (dialog) {
    if (!dialog.open) {
      await Promise.all([
        animate(elements.screen, 'slide-right-out'),
        animate(dialog, 'slide-right-in', () => { dialog.showModal() })
      ])
    }
  }

  static is (state) {
    return Object.values(Game.States).includes(state) && params.has(state)
  }

  static toString = classToString('Game')

  static States = Object.freeze({
    Edit: State.ParamKeys.Edit,
    Play: State.ParamKeys.Play
  })

  static states = Object.values(Game.States)
}
