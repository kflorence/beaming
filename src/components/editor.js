import { Group, Path, Point } from 'paper'
import { EventListeners } from './eventListeners'
import { CubeCoordinates } from './coordinates/cube'
import { OffsetCoordinates } from './coordinates/offset'

const elements = Object.freeze({
  configuration: document.getElementById('configuration')
})

export class Editor {
  group = new Group({ locked: true })
  id

  #center
  #eventListener = new EventListeners({ context: this })
  #puzzle

  constructor (puzzle, state) {
    this.id = state.getId()
    this.#puzzle = puzzle
    this.#eventListener.add([
      { element: puzzle.element, handler: this.#onPointerMove, type: 'pointermove' },
      { element: puzzle.element, handler: this.#onTap, type: 'tap' }
    ])
    document.body.classList.add(Editor.ClassNames.Edit)
    elements.configuration.value = state.getCurrentJSON()

    const parameters = this.#puzzle.layout.parameters
    console.log(parameters)
    this.#center = CubeCoordinates.fromPoint(this.#puzzle.center, parameters.circumradius)
    this.group.addChildren(Editor.mark(this.#puzzle.center, parameters.circumradius / 4))
    this.#puzzle.layers.edit.addChild(this.group)
  }

  teardown () {
    this.#eventListener.remove()
    this.group.removeChildren()
  }

  #getCubeCoordinates (point) {
    return CubeCoordinates.fromPoint(point.subtract(this.#puzzle.center), this.#puzzle.layout.parameters.circumradius)
  }

  #onPointerMove (event) {
    const parameters = this.#puzzle.layout.parameters
    const cube = this.#getCubeCoordinates(new Point(event.x, event.y))

    console.log(CubeCoordinates.toOffsetCoordinates(cube).toString())

    this.#puzzle.clearDebugPoints()
    const center = cube.toPoint(parameters.circumradius).add(this.#puzzle.center)
    this.#puzzle.layers.debug.addChild(new Path.RegularPolygon({
      center,
      closed: true,
      radius: parameters.circumradius,
      opacity: 0.2,
      sides: 6,
      style: {
        strokeColor: 'black',
        strokeWidth: 2
      }
    }))
    this.#puzzle.drawDebugPoint(center)
  }

  #onTap (event) {
    const cube = this.#getCubeCoordinates(event.detail.point)
    const offset = CubeCoordinates.toOffsetCoordinates(cube)
    const state = this.#puzzle.getState()

    const oldGridSize = new OffsetCoordinates(state.layout.tiles.length, this.#puzzle.layout.widestRow.length)
    const newGridSize = Editor.gridSize(offset)
    const rDiff = newGridSize.r - oldGridSize.r
    const cDiff = newGridSize.c - oldGridSize.c
    console.log(rDiff, cDiff)

    const newTiles = []
    for (let r = 0; r < newGridSize.r; r++) {
      newTiles.push(new Array(newGridSize.c).fill(null))
    }

    const newTileOffset = Editor.translate(offset, newGridSize)
    console.log('placement', newTiles, newTileOffset)
    if (!newTiles[newTileOffset.r]) {
      newTiles[newTileOffset.r] = []
    }
    newTiles[newTileOffset.r][newTileOffset.c] = { type: 'Tile' }

    console.log(newTiles)

    state.layout.tiles = newTiles
    this.#puzzle.reload(state)
    // Translate from editor offset to state offset
    /*
    editor:
    [
      [(-1,-1), null, null],
      [null, (0,0), null],
      [null, null, (1,1)]
    ]
    state:
    [
      [(0,0), null, null],
      [null, (1,1), null],
      [null, null, (2,2)]
    ]
     */

    // console.log(offset, tiles, rDiff, cDiff)
  }

  static gridSize (offset) {
    // The grid is always symmetrical and based on the furthest distance selected away from center
    const r = Math.abs(offset.r) * 2
    const c = Math.abs(offset.c) * 2
    return new OffsetCoordinates(r === 0 ? r : r + 1, c === 0 ? c : c + 1)
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

  static translate (offset, gridSize) {
    const center = new OffsetCoordinates(Math.floor(gridSize.r / 2), Math.floor(gridSize.c / 2))
    console.log('center', center)
    return offset.add(center)
  }

  static ClassNames = Object.freeze({
    Edit: 'edit'
  })
}
