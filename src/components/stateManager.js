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

  clearCache () {
    params.delete(StateManager.Keys.state)
    localStorage.clear()
  }

  getId () {
    return this.#state.id
  }

  getPuzzle () {
    return this.#state.current
  }

  setState (id) {
    let state

    // Allow cache to be cleared via URL param
    if (params.has('clearCache')) {
      this.clearCache()
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

  updatePuzzle (move) {
    this.#state.update(move)

    const state = this.#state.encode()

    url.searchParams.set(StateManager.Keys.state, state)
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
    id: 'id',
    state: 'state',
    zoom: 'zoom'
  })

  static #State = class {
    constructor (id, puzzle, moves) {
      this.id = id
      this.current = this.puzzle = puzzle

      // Optional
      this.moves = moves || []

      // Update current state
      this.moves.forEach((move) => this.update(move))
    }

    encode () {
      return base64encode(JSON.stringify({
        id: this.id,
        moves: this.moves,
        puzzle: this.puzzle
      }))
    }

    update (move) {
      // TODO update the state

      this.moves.push(move)
    }

    static fromEncoded (state) {
      state = JSON.parse(base64decode(state))
      // If there's no ID stored in state, generate a unique one
      return new StateManager.#State(state.id || crypto.randomUUID(), state.puzzle, state.moves)
    }

    static fromId (id) {
      return new StateManager.#State(id, Puzzles.get(id))
    }
  }
}
