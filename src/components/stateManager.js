import paper from 'paper'
import { Puzzles } from '../puzzles'
import { base64decode, base64encode } from './util'

const history = window.history
const location = window.location
const params = new URLSearchParams(location.search)

export class StateManager {
  #state

  getCenter () {
    return this.#state.center
  }

  getConfiguration () {
    return this.#state.configuration
  }

  getId () {
    return this.#state.id
  }

  getZoom () {
    return this.#state.zoom
  }

  setCenter (center) {
    this.#state.center = center
    // TODO update localStorage
  }

  setState (id) {
    // State stored in the URL will always take precedence
    if (params.has('state')) {
      this.#state = StateManager.#State.fromEncoded(params.get('state'))
    } else {
      this.#state = StateManager.#State.fromId(id || params.get('id') || Puzzles.ids[0])
    }

    // TODO: load center/zoom from localStorage

    id = this.getId()

    // The ID may not be set if loading from a unique state that does not match any puzzle configuration
    if (id) {
      const url = new URL(location)
      url.searchParams.set('id', id)
      history.pushState({ id }, '', url)
    }

    return id
  }

  setZoom (zoom) {
    this.#state.zoom = zoom
    // TODO update localStorage
  }

  updateState (command) {
    // TODO: update state from command
    const state = this.#state.encode()

    const url = new URL(location)
    url.searchParams.set('state', state)

    history.pushState({ state }, '', url)
  }

  static #State = class {
    constructor (id, configuration, moves, center, zoom) {
      this.id = id
      this.configuration = configuration

      // Optional
      this.moves = moves || []
      this.center = center || paper.view.center
      this.zoom = zoom || 1
    }

    encode () {
      // TODO
      return base64encode(JSON.stringify({
        id: this.id,
        moves: this.moves,
        configuration: this.configuration
      }))
    }

    static fromEncoded (state) {
      state = JSON.parse(base64decode(state))
      return new StateManager.#State(state.id, state.configuration, state.moves)
    }

    static fromId (id) {
      return new StateManager.#State(id, Puzzles.get(id))
    }
  }
}
