import { EventListeners } from './eventListeners'
import { emitEvent } from './util'

export class Gutter {
  element = document.getElementById('gutter')
  panes

  #eventListener = new EventListeners({ context: this })
  #isPointerDown = false

  constructor (paneA, paneB) {
    this.panes = [paneA, paneB]
    this.#eventListener.add([
      { element: this.element, handler: this.#onPointerDown, type: 'pointerdown' },
      { handler: this.#onPointerMove, type: 'pointermove' },
      { handler: this.#onPointerUp, type: 'pointerup' }
    ])
  }

  teardown () {
    this.#eventListener.remove()
  }

  #onPointerDown () {
    this.#isPointerDown = true
  }

  #onPointerMove (event) {
    if (!this.#isPointerDown) {
      return
    }

    const [paneA, paneB] = this.panes

    // Allow pane B to grow
    paneB.style.flex = 'auto'

    // Update width of pane A while dragging
    paneA.style.width = event.clientX + 'px'

    // Prevent pane A from growing
    paneA.style.flex = '0 auto'
  }

  #onPointerUp () {
    this.#isPointerDown = false
    emitEvent(Gutter.Events.Moved, { gutter: this })
  }

  static Events = Object.freeze({
    Moved: 'gutter-moved'
  })
}
