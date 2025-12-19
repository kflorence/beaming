import { emitEvent } from './util'

export class Stateful {
  #state

  constructor (state = {}) {
    this.setState(state)
  }

  getState () {
    return structuredClone(this.#state)
  }

  setState (state) {
    this.#state = structuredClone(state)
  }

  updateState (updater, eventDetail) {
    updater(this.#state)

    if (eventDetail) {
      // This will cause puzzle cache to update
      emitEvent(Stateful.Events.Update, eventDetail)
    }

    return this.getState()
  }

  static Events = Object.freeze({
    Update: 'state-update'
  })
}
