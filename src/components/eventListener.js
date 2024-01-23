const Element = window.Element

export class EventListener {
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
    Object.entries(this.#listeners).forEach(([name, config]) =>
      (config.element = element instanceof Element ? element : element?.[name] ?? config.element ?? document)
        .addEventListener(name, config.handler, config.options))
  }

  removeEventListeners () {
    Object.entries(this.#listeners).forEach(([event, config]) => {
      if (config.element) {
        config.element.removeEventListener(event, config.handler)
      }
    })
  }
}
