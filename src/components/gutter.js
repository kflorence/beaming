import { EventListeners } from './eventListeners'
import { deepEqual, emitEvent, getKeyFactory } from './util'

const localStorage = window.localStorage

export class Gutter {
  element = document.getElementById('gutter')
  horizontal
  panes

  #eventListener = new EventListeners({ context: this })
  #isPointerDown = false
  #previousPaneSizes = []

  constructor (pane0, pane1) {
    this.panes = [pane0, pane1]
    this.horizontal = localStorage.getItem(Gutter.#key(Gutter.CacheKeys.Horizontal)) === 'true'

    this.#eventListener.add([
      { element: this.element, handler: this.#onPointerDown, type: 'pointerdown' },
      { handler: this.#onPointerMove, type: 'pointermove' },
      { handler: this.#onPointerUp, type: 'pointerup' }
    ])

    this.reset()
  }

  reset () {
    this.panes.forEach((pane) => pane.removeAttribute('style'))

    document.body.classList.toggle(Gutter.ClassNames.Horizontal, this.horizontal)

    this.#updatePane({
      width: localStorage.getItem(Gutter.#key(Gutter.CacheKeys.Width)),
      height: localStorage.getItem(Gutter.#key(Gutter.CacheKeys.Height))
    })
  }

  teardown () {
    this.#eventListener.remove()
  }

  toggleOrientation () {
    this.horizontal = !this.horizontal
    localStorage.setItem(Gutter.#key(Gutter.CacheKeys.Horizontal), this.horizontal.toString())

    this.reset()

    return this.horizontal
  }

  #getPaneSizes () {
    return this.panes.map((pane) => {
      const bounds = pane.getBoundingClientRect()
      return [bounds.width, bounds.height]
    })
  }

  #onPointerDown () {
    this.#isPointerDown = true
    this.#previousPaneSizes = this.#getPaneSizes()
  }

  #onPointerMove (event) {
    if (!this.#isPointerDown) {
      return
    }

    this.#updatePane({ width: event.clientX, height: event.clientY })
  }

  #onPointerUp () {
    if (!this.#isPointerDown) {
      return
    }

    this.#isPointerDown = false

    if (this.#getPaneSizes().some((size, index) => !deepEqual(size, this.#previousPaneSizes[index]))) {
      // The size of the panes have changed
      const [pane] = this.panes
      const bounds = pane.getBoundingClientRect()

      if (this.horizontal) {
        localStorage.setItem(Gutter.#key(Gutter.CacheKeys.Height), bounds.height.toString())
      } else {
        localStorage.setItem(Gutter.#key(Gutter.CacheKeys.Width), bounds.width.toString())
      }

      emitEvent(Gutter.Events.Moved, { gutter: this })
    }
  }

  #updatePane ({ width, height }) {
    if ((this.horizontal && !height) || !width) {
      return
    }

    const [pane] = this.panes

    if (this.horizontal) {
      pane.style.height = `${height}px`
    } else {
      pane.style.width = `${width}px`
    }

    // Prevent pane from growing
    pane.style.flex = '0 auto'
  }

  static #key = getKeyFactory('gutter')

  static CacheKeys = Object.freeze({
    Height: 'height',
    Horizontal: 'horizontal',
    Width: 'width'
  })

  static ClassNames = Object.freeze({
    Horizontal: 'gutter-horizontal'
  })

  static Events = Object.freeze({
    Moved: 'gutter-moved'
  })
}
