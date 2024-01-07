import { Puzzles } from '../puzzles'
import { base64decode, base64encode, jsonDiffPatch } from './util'

const history = window.history
const location = window.location
const localStorage = window.localStorage

const params = new URLSearchParams(location.search)
const url = new URL(location)

export class State {
  #current
  #deltas
  #id
  #index
  #original
  #selectedTile

  constructor (id, original, deltas, deltasIndex, selectedTile) {
    this.#id = id
    this.#original = original
    this.#deltas = deltas || []
    this.#index = deltasIndex || this.#lastIndex()
    this.#selectedTile = selectedTile

    // Update current state
    this.#current = structuredClone(original)
    this.#deltas.filter((delta, index) => index <= this.#index).forEach((delta) => this.apply(delta))

    this.#updateCache(id)
  }

  apply (delta) {
    // Support for deltas stored as stringified JSON in cache
    if (typeof delta === 'string') {
      delta = JSON.parse(delta)
    }
    console.debug('StateManager: applying delta', delta)
    return jsonDiffPatch.patch(this.#current, delta)
  }

  canRedo () {
    return this.#index < this.#lastIndex()
  }

  canUndo () {
    return this.#index >= 0
  }

  encode () {
    return base64encode(JSON.stringify({
      id: this.#id,
      // No need to cache puzzles which exist in code
      original: Puzzles.has(this.#id) ? undefined : this.#original,
      deltas: this.#deltas,
      deltasIndex: this.#index,
      selectedTile: this.#selectedTile
    }))
  }

  getCurrent () {
    return structuredClone(this.#current)
  }

  getId () {
    return this.#id
  }

  getTitle () {
    return this.getId() + (this.#current.title ? ` - ${this.#current.title}` : '')
  }

  getSelectedTile () {
    return this.#selectedTile
  }

  moves () {
    return this.#index + 1
  }

  length () {
    return this.#deltas.length
  }

  redo () {
    const nextIndex = this.#index + 1
    if (nextIndex <= this.#lastIndex()) {
      this.#current = structuredClone(this.#original)
      this.#deltas.filter((delta, index) => index <= nextIndex).forEach((delta) => this.apply(delta))
      this.#index = nextIndex
      this.#updateCache()
    }
  }

  reset () {
    this.#current = structuredClone(this.#original)
    this.#deltas = []
    this.#index = this.#lastIndex()

    State.clearCache(this.getId())

    this.#updateCache()
  }

  setSelectedTile (tile) {
    const id = tile?.coordinates.offset.toString()
    if (this.#selectedTile !== id) {
      this.#selectedTile = id
      this.#updateCache()
    }
  }

  undo () {
    const previousIndex = this.#index - 1
    if (previousIndex >= -1) {
      this.#current = structuredClone(this.#original)
      this.#deltas.filter((delta, index) => index <= previousIndex).forEach((delta) => this.apply(delta))
      this.#index = previousIndex
      this.#updateCache()
    }
  }

  update (newState) {
    const delta = jsonDiffPatch.diff(this.#current, newState)
    console.debug('delta', delta)

    if (delta === undefined) {
      // Nothing to do
      return
    }

    // Handle updating after undoing
    if (this.#index < this.#lastIndex()) {
      // Remove all deltas after the current one
      this.#deltas.splice(this.#index + 1)
    }

    this.apply(delta)

    // It seems that the jsondiffpatch library modifies deltas on patch. To prevent that, they will be stored as
    // their stringified JSON representation and parsed before being applied.
    // See:https://github.com/benjamine/jsondiffpatch/issues/34
    this.#deltas.push(JSON.stringify(delta))
    this.#index = this.#lastIndex()

    this.#updateCache()
  }

  #key (key) {
    return State.key(key, this.getId())
  }

  #lastIndex () {
    return this.#deltas.length - 1
  }

  #updateCache () {
    const id = this.getId()
    const state = this.encode()

    url.hash = ['', id, state].join('/')
    history.pushState({ id, state }, '', url)
    localStorage.setItem(State.CacheKeys.id, id)
    localStorage.setItem(this.#key(State.CacheKeys.state), state)
  }

  static clearCache (id) {
    if (!id) {
      // Clear everything
      url.hash = ''
      history.pushState({}, '', url)
      id = localStorage.getItem(State.CacheKeys.id)
      localStorage.clear()
      // Keep current puzzle ID
      localStorage.setItem(State.CacheKeys.id, id)
    } else {
      // Clear a single puzzle
      url.hash = `/${id}`
      history.pushState({ id }, '', url)
      localStorage.removeItem(State.key(State.CacheKeys.state, id))
    }
  }

  static fromEncoded (state) {
    state = JSON.parse(base64decode(state))
    state.original = state.original || Puzzles.get(state.id)
    return new State(state.id, state.original, state.deltas, state.deltasIndex, state.selectedTile)
  }

  static fromId (id) {
    return new State(id, Puzzles.get(id))
  }

  static resolve (id) {
    let state

    // Allow cache to be cleared via URL param
    if (params.has(State.ParamKeys.clearCache)) {
      State.clearCache(params.get(State.ParamKeys.clearCache))
    }

    const pathSegments = url.hash.substring(1).split('/').filter((path) => path !== '')

    if (!id) {
      // If no explicit ID is given, try to load state from URL
      pathSegments.filter((path) => !Puzzles.has(path)).some((segment, index) => {
        try {
          state = State.fromEncoded(segment)
          id = state.getId()
        } catch (e) {
          console.debug(`Could not parse state from path segment '${index}'`, e)
        }

        return state !== undefined
      })
    }

    if (!state) {
      // Update ID before checking for state in localStorage.
      id = id || pathSegments[0] || localStorage.getItem(State.CacheKeys.id) || Puzzles.visible.firstId

      const localState = localStorage.getItem(State.key(State.CacheKeys.state, id))
      if (localState) {
        try {
          state = State.fromEncoded(localState)
        } catch (e) {
          console.debug(`Could not parse state with ID '${id}' from localStorage`, e)
        }
      }
    }

    if (!state) {
      // Fall back to loading state from Puzzles cache by ID
      state = State.fromId(id)
    }

    if (!state) {
      throw new Error(`Unable to resolve state for ID '${id}'`)
    }

    return state
  }

  static key (key, id) {
    return `${key}:${id}`
  }

  static CacheKeys = Object.freeze({
    center: 'center',
    id: 'id',
    state: 'state',
    zoom: 'zoom'
  })

  static ParamKeys = Object.freeze({
    clearCache: 'clearCache'
  })
}
