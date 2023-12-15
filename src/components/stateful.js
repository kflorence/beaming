import { emitEvent } from './util'

export class Stateful {
  #state

  constructor (state) {
    this.setState(state)
  }

  getState () {
    return structuredClone(this.#state)
  }

  setState (state) {
    this.#state = structuredClone(state)
  }

  updateState (updater, dispatchEvent = true) {
    updater(this.#state)

    if (dispatchEvent) {
      emitEvent(Stateful.Events.Update, { object: this })
    }

    return this.getState()
  }

  static Events = Object.freeze({
    Update: 'state-update'
  })
}
