import { emitEvent } from './util'

export class Stateful {
  #state = {}

  constructor (state) {
    this.#state = structuredClone(state)
  }

  getState () {
    return this.#state
  }

  updateState (updater, dispatchEvent = true) {
    const state = updater(this.#state) || this.#state
    if (dispatchEvent) {
      emitEvent(Stateful.Events.Update, { object: this, state })
    }
    return state
  }

  static Events = Object.freeze({
    Update: 'state-update'
  })
}
