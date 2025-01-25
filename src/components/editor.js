import { Group, Path, Point } from 'paper'
import { EventListeners } from './eventListeners'
import { CubeCoordinates } from './coordinates/cube'
import { Interact } from './interact'

const elements = Object.freeze({
  configuration: document.getElementById('configuration')
})

export class Editor {
  group = new Group({ locked: true })
  id

  #center
  #eventListener = new EventListeners({ context: this })
  #hover
  #parameters
  #puzzle

  constructor (puzzle, state) {
    this.id = state.getId()
    this.#center = puzzle.layout.center
    this.#parameters = puzzle.layout.parameters
    this.#puzzle = puzzle

    this.#eventListener.add([
      { element: puzzle.element, handler: this.#onPointerMove, type: 'pointermove' },
      { element: puzzle.element, handler: this.#onTap, type: 'tap' }
    ])

    document.body.classList.add(Editor.ClassNames.Edit)
    elements.configuration.value = state.getCurrentJSON()

    this.group.addChildren(Editor.mark(this.#center, this.#parameters.circumradius / 4))
    this.#puzzle.layers.edit.addChild(this.group)
  }

  teardown () {
    this.#eventListener.remove()
    this.group.removeChildren()
  }

  #getCubeCoordinates (point) {
    return CubeCoordinates.fromPoint(point.subtract(this.#center), this.#parameters.circumradius)
  }

  #getPoint (cube) {
    return cube.toPoint(this.#parameters.circumradius).add(this.#center)
  }

  #onPointerMove (event) {
    const cube = this.#getCubeCoordinates(this.#puzzle.getProjectPoint(Interact.point(event)))
    const center = this.#getPoint(cube)
    if (!this.#hover) {
      this.#hover = new Path.RegularPolygon({
        center,
        closed: true,
        radius: this.#parameters.circumradius,
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
    const cube = this.#getCubeCoordinates(event.detail.point)
    const offset = CubeCoordinates.toOffsetCoordinates(cube)

    console.log('tap', offset)

    const state = this.#puzzle.getState()
    if (!state.layout.tiles[offset.r]) {
      state.layout.tiles[offset.r] = {}
    }

    if (state.layout.tiles[offset.r][offset.c]) {
      delete state.layout.tiles[offset.r][offset.c]
    } else {
      state.layout.tiles[offset.r][offset.c] = { type: 'Tile' }
    }

    this.#puzzle.reload(state)
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
