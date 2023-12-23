export class EventListener {
  #element
  #listeners = {}

  constructor (context, events) {
    Object.entries(events).forEach(([name, handler]) => { this.#listeners[name] = handler.bind(context) })
  }

  addEventListeners (element) {
    this.#element = element ?? document
    Object.entries(this.#listeners).forEach(([name, handler]) =>
      this.#element.addEventListener(name, handler))
  }

  removeEventListeners () {
    if (!this.#element) {
      return
    }

    Object.entries(this.#listeners).forEach(([event, handler]) =>
      this.#element.removeEventListener(event, handler))
  }
}
