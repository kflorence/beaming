import { Puzzles } from '../puzzles'
import { base64decode, base64encode, jsonDiffPatch } from './util'

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

  get () {
    return structuredClone(this.#state?.current)
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

  reset () {
    const id = this.getId()

    this.clearCache(id)

    this.#state.reset()

    const state = this.#state.encode()

    url.searchParams.set(StateManager.Keys.state, state)
    history.pushState({ id, state }, '', url)
    localStorage.setItem(this.#key(StateManager.Keys.state), state)
  }

  update (newState) {
    const delta = jsonDiffPatch.diff(this.#state.current, newState)

    console.log('StateManager.update', delta)
    if (delta === undefined) {
      // Nothing to do
      return
    }

    this.#state.update(delta)

    const state = this.#state.encode()

    url.searchParams.set(StateManager.Keys.state, state)
    history.pushState({ state }, '', url)
    localStorage.setItem(this.#key(StateManager.Keys.state), state)

    return this.get()
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

  static #State = class {
    constructor (id, puzzle, deltas) {
      this.id = id
      this.puzzle = puzzle
      this.deltas = deltas || []

      // Update current state
      this.current = structuredClone(puzzle)
      this.deltas.forEach((delta) => this.apply(delta))
    }

    apply (delta) {
      console.debug('StateManager: applying delta', delta)
      return jsonDiffPatch.patch(this.current, delta)
    }

    encode () {
      return base64encode(JSON.stringify({
        id: this.id,
        deltas: this.deltas,
        // No need to cache puzzles which exist in code
        puzzle: Puzzles.has(this.id) ? undefined : this.puzzle
      }))
    }

    reset () {
      this.current = structuredClone(this.puzzle)
      this.deltas = []
    }

    update (delta) {
      this.apply(delta)
      this.deltas.push(delta)
    }

    static fromEncoded (state) {
      state = JSON.parse(base64decode(state))
      state.id = state.id || crypto.randomUUID()
      state.puzzle = state.puzzle || Puzzles.get(state.id)
      return new StateManager.#State(state.id || crypto.randomUUID(), state.puzzle, state.deltas)
    }

    static fromId (id) {
      return new StateManager.#State(id, Puzzles.get(id))
    }
  }
}
