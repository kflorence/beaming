import { confirm } from './dialog.js'
import { Puzzle } from './puzzle'
import { Editor } from './editor'
import { debug } from './debug'
import { animate, classToString, emitEvent, params, uniqueId, url } from './util'
import { State } from './state'
import { Storage } from './storage'
import { EventListeners } from './eventListeners'
import { Events } from './settings/cache.js'
import { Puzzles } from '../puzzles/index.js'

const elements = Object.freeze({
  back: document.getElementById('back'),
  configuration: document.getElementById('play-custom-configuration'),
  configurationError: document.getElementById('play-custom-configuration-error'),
  delete: document.getElementById('delete'),
  dialogEdit: document.getElementById('dialog-edit'),
  dialogPlay: document.getElementById('dialog-play'),
  dialogTitle: document.getElementById('dialog-title'),
  edit: document.getElementById('title-edit'),
  editNew: document.getElementById('edit-new'),
  editPuzzles: document.getElementById('edit-puzzles'),
  play: document.getElementById('title-play'),
  playLoad: document.getElementById('play-custom-load'),
  playPuzzles: document.getElementById('play-puzzles'),
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
      { type: 'click', element: elements.back, handler: this.#onBack },
      { type: 'click', element: elements.editNew, handler: this.#onEditNew },
      { type: 'click', element: elements.editPuzzles, handler: this.#onEditPuzzleClick },
      { type: 'click', element: elements.playLoad, handler: this.#onPlayLoad },
      { type: 'click', element: elements.playPuzzles, handler: this.#onPlayPuzzleClick },
      { type: 'click', element: elements.quit, handler: this.quit },
      { type: 'click', element: elements.title, handler: this.title },
      { type: Events.CacheClear, handler: this.#onSettingsCacheClear },
      { type: Storage.Events.Delete, handler: this.#onStorageDelete },
      { type: Storage.Events.Set, handler: this.#onStorageSet }
    ])

    Game.updatePuzzles()

    const state = State.resolve()
    if (Game.is(Game.States.Play)) {
      if (!state) {
        elements.dialogPlay.showModal()
      } else {
        // noinspection JSIgnoredPromiseFromCall
        this.play(state)
      }
    } else if (Game.is(Game.States.Edit)) {
      if (!state) {
        elements.dialogEdit.showModal()
      } else {
        // noinspection JSIgnoredPromiseFromCall
        this.edit(state)
      }
    } else {
      elements.dialogTitle.showModal()
    }
  }

  async edit (state) {
    if (!document.body.classList.contains(Game.States.Edit)) {
      this.#reset(Game.States.Edit)

      // Transition back to the puzzle when the edit dialog is closed
      elements.edit.dataset.element = 'screen'

      this.puzzle.teardown()
    }

    await Game.dialogClose(elements.dialogEdit)
    await this.editor.select(state, { animations: [Puzzle.Animations.FadeIn] })
  }

  async play (state) {
    if (!document.body.classList.contains(Game.States.Play)) {
      this.#reset(Game.States.Play)

      // Transition back to the puzzle when the play dialog is closed
      elements.play.dataset.element = 'screen'

      this.editor.teardown()
      this.puzzle.teardown()
    }

    await Game.dialogClose(elements.dialogPlay)
    await this.puzzle.select(state, { animations: [Puzzle.Animations.FadeIn] })
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

  async #onBack () {
    const currentId = this.puzzle.state.getId()
    const parent = params.get(State.CacheKeys.Parent)
    const parents = parent?.split(',')
    const parentId = parents?.pop()

    if (parentId !== undefined && currentId !== parentId) {
      // Update parents breadcrumbs
      if (parents.length) {
        params.set(State.CacheKeys.Parent, parents.join(','))
      } else {
        params.delete(State.CacheKeys.Parent)
      }

      this.select(parentId, { animations: [Puzzle.Animations.SlideRight] })
    } else {
      Game.dialogOpen(Game.is(State.ContextKeys.Play) ? elements.dialogPlay : elements.dialogEdit)
    }
  }

  #delete (id, context) {
    if (Puzzles.has(id)) {
      return
    }

    confirm(`Are you sure you want to remove puzzle "${id}"? This cannot be undone.`, async () => {
      State.delete(id, context)
      Game.updatePuzzles()
    })
  }

  async #onPlayLoad () {
    try {
      const configuration = JSON.parse(elements.configuration.value)
      const state = new State(configuration.id ?? uniqueId(), configuration)
      await this.puzzle.reload(state, { animations: [Puzzle.Animations.FadeIn] })
      elements.configuration.value = ''
      elements.configurationError.textContent = ''
      await Game.dialogClose(elements.dialogPlay)
    } catch (e) {
      console.error(e)
      elements.configurationError.textContent = 'Could not load puzzle: configuration is invalid'
    }
  }

  #onEditNew () {
    const id = uniqueId()
    this.edit(new State(id, { id, unlocked: true }))
  }

  async #onEditPuzzleClick (event) {
    const $item = event.target.closest('.puzzle')
    const id = $item.dataset.id
    if (event.target.classList.contains('remove')) {
      this.#delete(id, State.ContextKeys.Edit)
    } else {
      this.edit(id)
    }
  }

  async #onPlayPuzzleClick (event) {
    const $item = event.target.closest('.puzzle')
    const id = $item.dataset.id
    if (event.target.classList.contains('remove')) {
      this.#delete(id, State.ContextKeys.Play)
    } else {
      const puzzle = Puzzles.get(id)
      const state = State.fromCache(id)
      if (!puzzle?.unlocked && state === undefined) {
        console.debug(`Puzzle not unlocked: ${id}`)
        return
      }
      this.play(id)
    }
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

  static updatePuzzles (contexts = Object.values(State.ContextKeys)) {
    if (contexts.includes(State.ContextKeys.Edit)) {
      Puzzles.updateDom('edit-puzzles', State.ContextKeys.Edit)
    }
    if (contexts.includes(State.ContextKeys.Play)) {
      Puzzles.updateDom('play-puzzles', State.ContextKeys.Play)
    }
  }

  static toString = classToString('Game')

  static States = Object.freeze({
    Edit: State.ParamKeys.Edit,
    Play: State.ParamKeys.Play
  })

  static states = Object.values(Game.States)
}
