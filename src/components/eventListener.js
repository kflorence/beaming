export class EventListener {
  #element
  #listeners = {}

  constructor (context, events) {
    Object.entries(events).forEach(([name, config]) => {
      // Support [name: handler]
      if (typeof config === 'function') {
        config = { handler: config }
      }
      config.handler = config.handler.bind(context)
      this.#listeners[name] = config
    })
  }

  addEventListeners (element) {
    this.#element = element ?? document
    Object.entries(this.#listeners).forEach(([name, config]) =>
      this.#element.addEventListener(name, config.handler, config.options))
  }

  removeEventListeners () {
    if (!this.#element) {
      return
    }

    Object.entries(this.#listeners).forEach(([event, config]) =>
      this.#element.removeEventListener(event, config.handler))
  }
}
