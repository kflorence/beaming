import { Puzzles } from '../puzzles'
import { base64decode, base64encode, jsonDiffPatch } from './util'

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

  getState () {
    return this.#state
  }

  redo () {
    if (this.#state.redo()) {
      this.#updateHistory()
    }
  }

  resetState () {
    if (!this.#state) {
      return
    }

    const id = this.#state.getId()

    this.clearCache(id)
    this.#state.reset()
    this.#updateHistory(id)
  }

  setSelectedTile (tile) {
    if (this.#state.setSelectedTile(tile)) {
      this.#updateHistory()
    }
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
          id = this.#state.getId()
        } catch (e) {
          console.debug(`Could not parse state from path segment '${index}'`, e)
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
          console.debug(`Could not parse state with ID '${id}' from localStorage`, e)
        }
      }
    }

    if (!this.#state) {
      // Fall back to loading state from Puzzles cache by ID
      this.#state = StateManager.#State.fromId(id)
    }

    if (!this.#state) {
      throw new Error(`Unable to resolve state for ID '${id}'`)
    }

    this.#updateHistory(id)

    return this.#state
  }

  undo () {
    if (this.#state.undo()) {
      this.#updateHistory()
    }
  }

  updateState (state) {
    if (this.#state.update(state)) {
      this.#updateHistory()
    }
  }

  #key (key) {
    return StateManager.key(key, this.#state.getId())
  }

  #updateHistory (id) {
    id = id || this.#state.getId()
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
    #current
    #deltas
    #deltasIndex
    #id
    #original
    #selectedTile

    constructor (id, original, deltas, deltasIndex, selectedTile) {
      this.#id = id
      this.#original = original
      this.#deltas = deltas || []
      this.#deltasIndex = deltasIndex || this.#lastDeltasIndex()
      this.#selectedTile = selectedTile

      // Update current state
      this.#current = structuredClone(original)
      this.#deltas.filter((delta, index) => index <= this.#deltasIndex).forEach((delta) => this.apply(delta))
    }

    apply (delta) {
      console.debug('StateManager: applying delta', delta)
      return jsonDiffPatch.patch(this.#current, delta)
    }

    canRedo () {
      return this.#deltasIndex < this.#lastDeltasIndex()
    }

    canUndo () {
      return this.#deltasIndex >= 0
    }

    encode () {
      return base64encode(JSON.stringify({
        id: this.#id,
        // No need to cache puzzles which exist in code
        original: Puzzles.has(this.#id) ? undefined : this.#original,
        deltas: this.#deltas,
        deltasIndex: this.#deltasIndex,
        selectedTile: this.selectedTile
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

    redo () {
      const nextIndex = this.#deltasIndex + 1
      if (nextIndex <= this.#lastDeltasIndex()) {
        this.#current = structuredClone(this.#original)
        this.#deltas.filter((delta, index) => index <= nextIndex).forEach((delta) => this.apply(delta))
        this.#deltasIndex = nextIndex
        return true
      }

      return false
    }

    reset () {
      this.#current = structuredClone(this.#original)
      this.#deltas = []
      this.#deltasIndex = this.#lastDeltasIndex()
    }

    undo () {
      const previousIndex = this.#deltasIndex - 1
      if (previousIndex >= -1) {
        this.#current = structuredClone(this.#original)
        this.#deltas.filter((delta, index) => index <= previousIndex).forEach((delta) => this.apply(delta))
        this.#deltasIndex = previousIndex
        return true
      }

      return false
    }

    update (newState) {
      const delta = jsonDiffPatch.diff(this.#current, newState)
      console.debug('State.update', delta)

      if (delta === undefined) {
        // Nothing to do
        return false
      }

      // Handle updating after undoing
      if (this.#deltasIndex < this.#lastDeltasIndex()) {
        // Remove all deltas after the current one
        this.#deltas.splice(this.#deltasIndex + 1)
      }

      this.apply(delta)
      this.#deltas.push(delta)
      this.#deltasIndex = this.#lastDeltasIndex()

      return true
    }

    setSelectedTile (tile) {
      const id = tile?.coordinates.offset.toString()
      if (this.selectedTile === id) {
        return false
      }

      this.selectedTile = id

      return true
    }

    #lastDeltasIndex () {
      return this.#deltas.length - 1
    }

    static fromEncoded (state) {
      state = JSON.parse(base64decode(state))
      state.original = state.original || Puzzles.get(state.id)
      return new StateManager.#State(state.id, state.original, state.deltas, state.deltasIndex, state.selectedTile)
    }

    static fromId (id) {
      return new StateManager.#State(id, Puzzles.get(id))
    }
  }
}
