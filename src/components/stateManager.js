import { Puzzles } from '../puzzles'
import { base64decode, base64encode } from './util'

const crypto = window.crypto
const history = window.history
const location = window.location
const localStorage = window.localStorage

const params = new URLSearchParams(location.search)
const url = new URL(location)

export class StateManager {
  #state

  clearCache (id) {
    params.delete(StateManager.Keys.state)

    if (!id) {
      // Clear everything
      Array.from(url.searchParams)
        .filter(([key]) => key !== StateManager.Keys.clearCache)
        .forEach(([key]) => url.searchParams.delete(key))
      history.pushState({}, '', url)
      localStorage.clear()
    } else {
      // Clear a single puzzle
      url.searchParams.delete(StateManager.Keys.state)
      history.pushState({ id }, '', url)
      localStorage.removeItem(StateManager.key(StateManager.Keys.state, id))
    }
  }

  getId () {
    return this.#state?.id
  }

  getPuzzle () {
    return this.#state?.current
  }

  setState (id) {
    let state

    // Allow cache to be cleared via URL param
    if (params.has(StateManager.Keys.clearCache)) {
      this.clearCache(params.get(StateManager.Keys.clearCache))
    }

    if (!id) {
      // Check for encoded state in URL if no explicit ID is given
      state = params.get(StateManager.Keys.state)
    }

    if (!state) {
      // Update ID before checking for state in localStorage.
      id = id || params.get(StateManager.Keys.id) || localStorage.getItem(StateManager.Keys.id) || Puzzles.firstId
      state = localStorage.getItem(StateManager.key(StateManager.Keys.state, id))
    }

    if (state) {
      this.#state = StateManager.#State.fromEncoded(state)
    } else {
      this.#state = StateManager.#State.fromId(id)
      state = this.#state.encode()
    }

    id = this.getId()

    url.searchParams.set(StateManager.Keys.id, id)
    url.searchParams.set(StateManager.Keys.state, state)
    url.searchParams.sort()

    history.pushState({ id, state }, '', url)
    localStorage.setItem(StateManager.Keys.id, id)
    localStorage.setItem(this.#key(StateManager.Keys.state), state)

    return id
  }

  resetPuzzle () {
    const id = this.getId()

    this.clearCache(id)

    this.#state.reset()

    const state = this.#state.encode()

    url.searchParams.set(StateManager.Keys.state, state)
    history.pushState({ id, state }, '', url)
    localStorage.setItem(this.#key(StateManager.Keys.state), state)
  }

  updatePuzzle (...updates) {
    if (!updates.length) {
      return
    }

    updates.forEach((update) => this.#state.update(update))

    const state = this.#state.encode()

    url.searchParams.set(StateManager.Keys.state, state)
    history.pushState({ state }, '', url)
    localStorage.setItem(this.#key(StateManager.Keys.state), state)
  }

  #key (key) {
    return StateManager.key(key, this.getId())
  }

  static key (key, id) {
    return `${key}:${id}`
  }

  static Keys = Object.freeze({
    center: 'center',
    clearCache: 'clearCache',
    id: 'id',
    state: 'state',
    zoom: 'zoom'
  })

  static Update = class {
    constructor (row, column, key, index, data) {
      this.row = row
      this.column = column
      this.key = key
      this.index = index
      this.data = data
    }

    static item (tile, item, data) {
      const offset = tile.coordinates.offset
      return new StateManager.Update(offset.r, offset.c, StateManager.Update.Keys.items, item.getStateIndex(), data)
    }

    static Keys = Object.freeze({
      items: 'items',
      modifiers: 'modifiers'
    })
  }

  static #State = class {
    constructor (id, puzzle, updates) {
      this.id = id
      this.puzzle = puzzle

      // Optional
      this.updates = updates || []

      // Update current state
      this.current = structuredClone(puzzle)
      this.updates.forEach((update) => this.apply(update))
    }

    apply (update) {
      console.log('replaying update from state', update)
      // TODO: use jsonpath instead
      return Object.assign(this.current.layout[update.row][update.column][update.key][update.index], update.data)
    }

    encode () {
      return base64encode(JSON.stringify({
        id: this.id,
        updates: this.updates,
        puzzle: this.puzzle
      }))
    }

    reset () {
      this.current = structuredClone(this.puzzle)
      this.updates = []
    }

    update (update) {
      this.apply(update)
      this.updates.push(update)
    }

    static fromEncoded (state) {
      state = JSON.parse(base64decode(state))
      // If there's no ID stored in state, generate a unique one
      return new StateManager.#State(state.id || crypto.randomUUID(), state.puzzle, state.updates)
    }

    static fromId (id) {
      return new StateManager.#State(id, Puzzles.get(id))
    }
  }
}
