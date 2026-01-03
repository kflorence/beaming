import { EventListeners } from './eventListeners'
import { Storage } from './storage'
import { deepEqual, emitEvent, getKeyFactory } from './util'

export class Gutter {
  element = document.getElementById('gutter')
  horizontal
  panes

  #eventListener = new EventListeners({ context: this })
  #isPointerDown = false
  #previousPaneSizes = []

  constructor (pane0, pane1) {
    this.panes = [pane0, pane1]
    this.horizontal = Storage.get(Gutter.#key(Gutter.CacheKeys.Horizontal)) === 'true'
  }

  setup () {
    if (this.#eventListener.length()) {
      return
    }

    this.#eventListener.add([
      { type: 'pointercancel', handler: this.#onPointerUp },
      { type: 'pointerdown', element: this.element, handler: this.#onPointerDown },
      { type: 'pointermove', handler: this.#onPointerMove },
      { type: 'pointerup', handler: this.#onPointerUp }
    ])

    this.update()
  }

  teardown () {
    document.body.classList.remove(...Gutter.classNames)
    this.panes.forEach((pane) => pane.removeAttribute('style'))
    this.#eventListener.remove()
  }

  toggleOrientation () {
    this.horizontal = !this.horizontal
    Storage.set(Gutter.#key(Gutter.CacheKeys.Horizontal), this.horizontal.toString())

    this.update()

    emitEvent(Gutter.Events.Moved, { gutter: this })

    return this.horizontal
  }

  update () {
    this.panes.forEach((pane) => pane.removeAttribute('style'))

    document.body.classList.toggle(Gutter.ClassNames.Horizontal, this.horizontal)

    this.#updatePane({
      width: Storage.get(Gutter.#key(Gutter.CacheKeys.Width)),
      height: Storage.get(Gutter.#key(Gutter.CacheKeys.Height))
    })
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

      // Don't persist these values since they are machine dependent
      if (this.horizontal) {
        Storage.set(Gutter.#key(Gutter.CacheKeys.Height), bounds.height.toString(), false)
      } else {
        Storage.set(Gutter.#key(Gutter.CacheKeys.Width), bounds.width.toString(), false)
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

  static classNames = Object.values(Gutter.ClassNames)

  static Events = Object.freeze({
    Moved: 'gutter-moved'
  })
}
