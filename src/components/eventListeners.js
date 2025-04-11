export class EventListeners {
  #events = []
  #options = { element: document }

  constructor (options = {}) {
    this.#options = Object.assign(this.#options, options)
  }

  add (events, options = {}) {
    this.#events = this.#events.concat((Array.isArray(events) ? events : [events]).map((event) => {
      event = Object.assign({}, this.#options, options, event)
      if (!event.type) {
        throw new Error('Event type is required')
      }
      if (event.context) {
        event.handler = event.handler.bind(event.context)
      }
      event.element.addEventListener(event.type, event.handler, event.options)
      return event
    }))
  }

  remove () {
    this.#events.forEach((event) => event.element.removeEventListener(event.type, event.handler))
    this.#events = []
  }
}
