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
    if (!id) {
      // Clear everything
      url.pathname = ''
      history.pushState({}, '', url)
      localStorage.clear()
    } else {
      // Clear a single puzzle
      url.pathname = `/${id}`
      history.pushState({ id }, '', url)
      localStorage.removeItem(StateManager.key(StateManager.Keys.state, id))
    }
  }

  get () {
    return structuredClone(this.#state?.current)
  }

  getId () {
    return this.#state?.id
  }

  getTitle () {
    return this.#state?.current.title
  }

  setState (id) {
    this.#state = undefined

    // Allow cache to be cleared via URL param
    if (params.has(StateManager.Keys.clearCache)) {
      this.clearCache(params.get(StateManager.Keys.clearCache))
    }

    const pathSegments = url.pathname.split('/').filter((path) => path !== '')

    if (!id) {
      // If no explicit ID is given, try to load state from URL
      pathSegments.filter((path) => !Puzzles.has(path)).some((segment, index) => {
        try {
          this.#state = StateManager.#State.fromEncoded(segment)
          id = this.getId()
        } catch (e) {
          console.debug(`Path segment ${index} is not valid state`, e)
        }

        return this.#state !== undefined
      })
    }

    if (!this.#state) {
      // Update ID before checking for state in localStorage.
      id = id || pathSegments[0] || localStorage.getItem(StateManager.Keys.id) || Puzzles.firstId

      const state = localStorage.getItem(StateManager.key(StateManager.Keys.state, id))
      if (state) {
        try {
          this.#state = StateManager.#State.fromEncoded(state)
        } catch (e) {
          console.debug(`Unable to load state for id ${id} from localStorage`, e)
        }
      }
    }

    if (!this.#state) {
      // Fall back to loading state from Puzzles cache by ID
      this.#state = StateManager.#State.fromId(id)
    }

    this.#updateHistory(id)

    return id
  }

  reset () {
    const id = this.getId()

    this.clearCache(id)
    this.#state.reset()
    this.#updateHistory(id)
  }

  update (newState) {
    const delta = jsonDiffPatch.diff(this.#state.current, newState)

    console.debug('StateManager.update', delta)
    if (delta === undefined) {
      // Nothing to do
      return
    }

    this.#state.update(delta)
    this.#updateHistory()

    return this.get()
  }

  #key (key) {
    return StateManager.key(key, this.getId())
  }

  #updateHistory (id) {
    id = id || this.getId()
    const state = this.#state.encode()

    url.pathname = [id, state].join('/')
    history.pushState({ id, state }, '', url)
    localStorage.setItem(StateManager.Keys.id, id)
    localStorage.setItem(this.#key(StateManager.Keys.state), state)
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
