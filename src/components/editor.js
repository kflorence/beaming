import { Group, Path, Point } from 'paper'
import { EventListeners } from './eventListeners'
import { Interact } from './interact'
import { View } from './view'
import { Puzzle } from './puzzle'

const elements = Object.freeze({
  configuration: document.getElementById('configuration'),
  recenter: document.getElementById('recenter')
})

export class Editor {
  group = new Group({ locked: true })
  id

  #eventListener = new EventListeners({ context: this })
  #hover
  #layout
  #puzzle
  #state

  constructor (puzzle, state) {
    this.id = state.getId()

    this.#puzzle = puzzle
    this.#layout = puzzle.layout
    this.#state = state

    this.#eventListener.add([
      { element: elements.configuration, handler: this.#onConfigurationUpdate, type: 'focusout' },
      { element: puzzle.element, handler: this.#onPointerMove, type: 'pointermove' },
      { handler: this.#onPuzzleUpdate, type: Puzzle.Events.Updated },
      { element: elements.recenter, handler: this.#onRecenter, type: 'click' },
      { element: puzzle.element, handler: this.#onTap, type: 'tap' }
    ])

    document.body.classList.add(Editor.ClassNames.Edit)
    elements.configuration.value = state.getCurrentJSON()

    this.group.addChildren(Editor.mark(this.#layout.getCenter(), this.#layout.parameters.circumradius / 4))
    this.#puzzle.layers.edit.addChild(this.group)
  }

  teardown () {
    this.#eventListener.remove()
    this.group.removeChildren()
  }

  #onConfigurationUpdate () {
    try {
      const state = JSON.parse(elements.configuration.value)
      this.#puzzle.addMove()
      // Need to force a reload to make sure the UI is in sync with the state
      this.#puzzle.reload(state)
    } catch (e) {
      // TODO: maybe display something to the user, too
      console.error(e)
    }
  }

  #onPointerMove (event) {
    const offset = this.#layout.getOffset(this.#puzzle.getProjectPoint(Interact.point(event)))
    const center = this.#layout.getPoint(offset)
    if (!this.#hover) {
      this.#hover = new Path.RegularPolygon({
        center,
        closed: true,
        radius: this.#layout.parameters.circumradius,
        opacity: 0.2,
        sides: 6,
        style: {
          strokeColor: 'black',
          strokeWidth: 2
        }
      })

      this.group.addChild(this.#hover)
    } else {
      this.#hover.position = center
    }
  }

  #onPuzzleUpdate () {
    elements.configuration.value = this.#state.getCurrentJSON()
  }

  #onRecenter () {
    View.setCenter(this.#layout.getCenter())
  }

  #onTap (event) {
    const offset = this.#layout.getOffset(event.detail.point)
    const tile = this.#puzzle.layout.getTile(offset)

    console.log('tap', offset, tile)

    if (tile) {
      this.#puzzle.layout.removeTile(offset)
    } else {
      this.#puzzle.layout.addTile(offset)
    }

    this.#puzzle.addMove()
    this.#puzzle.updateState()
    this.#puzzle.update()
  }

  static mark (center, width) {
    const offset = new Point(width, width).divide(2)
    const square = new Path.Rectangle(center.subtract(offset), width)
    const settings = {
      opacity: 0.5,
      style: {
        strokeCap: 'round',
        strokeColor: 'black',
        strokeJoin: 'round',
        strokeWidth: 2
      }
    }
    return [
      new Path(Object.assign({ segments: [square.segments[0], square.segments[2]] }, settings)),
      new Path(Object.assign({ segments: [square.segments[1], square.segments[3]] }, settings))
    ]
  }

  static ClassNames = Object.freeze({
    Edit: 'edit'
  })
}
