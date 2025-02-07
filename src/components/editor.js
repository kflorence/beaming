import { Group, Path, Point } from 'paper'
import { EventListeners } from './eventListeners'
import { Interact } from './interact'

const elements = Object.freeze({
  configuration: document.getElementById('configuration')
})

export class Editor {
  group = new Group({ locked: true })
  id

  #eventListener = new EventListeners({ context: this })
  #hover
  #layout
  #puzzle

  constructor (puzzle, state) {
    this.id = state.getId()

    this.#puzzle = puzzle
    this.#layout = puzzle.layout

    this.#eventListener.add([
      { element: puzzle.element, handler: this.#onPointerMove, type: 'pointermove' },
      { element: puzzle.element, handler: this.#onTap, type: 'tap' }
    ])

    document.body.classList.add(Editor.ClassNames.Edit)
    elements.configuration.value = state.getCurrentJSON()

    // TODO: replace this with a "re-center" icon
    this.group.addChildren(Editor.mark(this.#layout.getCenter(), this.#layout.parameters.circumradius / 4))
    this.#puzzle.layers.edit.addChild(this.group)
  }

  teardown () {
    this.#eventListener.remove()
    this.group.removeChildren()
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

  #onTap (event) {
    const offset = this.#layout.getOffset(event.detail.point)

    console.log('tap', offset)

    if (this.#puzzle.layout.getTile(offset)) {
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
