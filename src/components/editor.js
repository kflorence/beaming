import { Group, Path, Point } from 'paper'
import { EventListeners } from './eventListeners'
import { CubeCoordinates } from './coordinates/cube'

const elements = Object.freeze({
  configuration: document.getElementById('configuration')
})

export class Editor {
  group = new Group({ locked: true })
  id

  #center
  #eventListener = new EventListeners({ context: this })
  #puzzle
  #tile

  constructor (puzzle, state) {
    this.id = state.getId()
    this.#puzzle = puzzle
    this.#eventListener.add({ element: puzzle.element, handler: this.#onPointerMove, type: 'pointermove' })
    document.body.classList.add(Editor.ClassNames.Edit)
    elements.configuration.value = state.getCurrentJSON()
  }

  setup () {
    this.#center = CubeCoordinates.fromPoint(this.#puzzle.center, this.#puzzle.layout.tileSize)
    this.group.addChildren(Editor.mark(this.#puzzle.center, this.#puzzle.layout.tileSize / 4))
    this.#puzzle.layers.edit.addChild(this.group)
  }

  teardown () {
    this.group.removeChildren()
  }

  #onPointerMove (event) {
    // TODO figuring out how to map pointer events to a rough "grid"
    const cube = CubeCoordinates.fromPoint(new Point(event.x, event.y), this.#puzzle.layout.tileSize)
    const offset = CubeCoordinates.toOffsetCoordinates(CubeCoordinates.subtract(cube, this.#center))
    console.log(offset.toString())
    this.#puzzle.clearDebugPoints()
    this.#puzzle.drawDebugPoint(cube.toPoint(this.#puzzle.layout.tileSize))
  }

  static mark (center, width) {
    const offset = new Point(width, width).divide(2)
    const square = new Path.Rectangle(center.subtract(offset), width)
    const settings = {
      opacity: 0.5,
      strokeCap: 'round',
      strokeColor: 'black',
      strokeJoin: 'round',
      strokeWidth: 2
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
