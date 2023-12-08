import objectPath from 'object-path'
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

  get (path) {
    return path ? objectPath.get(this.#state?.current, path) : this.#state?.current
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

  update (move) {
    if (!move.length) {
      // Nothing to do
      return
    }

    this.#state.update(move)

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

  static Paths = Object.freeze({
    items: 'items',
    layout: 'layout',
    modifiers: 'modifiers'
  })

  static Update = class {
    constructor (type, path, ...args) {
      if (!Object.hasOwn(StateManager.Update.Types, type)) {
        throw new Error(`Invalid type: ${type}`)
      }

      this.args = args || []
      this.path = path
      this.type = type
    }

    static Types = Object.freeze({
      del: 'del',
      move: 'move',
      set: 'set'
    })
  }

  static #State = class {
    constructor (id, puzzle, moves) {
      this.id = id
      this.puzzle = puzzle

      // Optional
      this.moves = moves || []

      // Update current state
      this.current = structuredClone(puzzle)
      this.moves.flat().forEach((update) => this.apply(update))
    }

    apply (update) {
      console.log('applying update', update)
      switch (update.type) {
        case StateManager.Update.Types.move: {
          const state = objectPath.get(this.current, update.path)
          objectPath.del(this.current, update.path)
          objectPath.set(this.current, update.args[0], state)
          break
        }
        default: {
          objectPath[update.type](this.current, update.path, ...update.args)
        }
      }
      return update
    }

    encode () {
      return base64encode(JSON.stringify({
        id: this.id,
        moves: this.moves,
        // No need to cache puzzles which exist in code
        puzzle: Puzzles.has(this.id) ? undefined : this.puzzle
      }))
    }

    reset () {
      this.current = structuredClone(this.puzzle)
      this.moves = []
    }

    update (move) {
      this.moves.push(move.map((update) => this.apply(update)))
    }

    static fromEncoded (state) {
      state = JSON.parse(base64decode(state))
      state.id = state.id || crypto.randomUUID()
      state.puzzle = state.puzzle || Puzzles.get(state.id)
      return new StateManager.#State(state.id || crypto.randomUUID(), state.puzzle, state.moves)
    }

    static fromId (id) {
      return new StateManager.#State(id, Puzzles.get(id))
    }
  }
}
