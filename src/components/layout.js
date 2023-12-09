import paper, { Layer } from 'paper'
import { CubeCoordinates } from './coordinates/cube'
import { OffsetCoordinates } from './coordinates/offset'
import { Tile } from './items/tile'
import { getConvertedDirection } from './util'
import { Stateful } from './stateful'

export class Layout extends Stateful {
  #tilesByAxial = []
  #tilesByOffset = []

  items = []
  layers = {}
  tiles = []
  tileSize = 100

  constructor (state) {
    super(state)

    const center = paper.view.center
    const parameters = Tile.parameters(this.tileSize)

    const height = state.length * parameters.height
    const startingOffsetY = center.y - height / 2

    this.layers.tiles = new Layer()
    this.layers.items = new Layer()

    for (let r = 0; r < state.length; r++) {
      const row = state[r]
      const rowByAxial = new Array(row.length).fill(null)
      const rowByOffset = new Array(row.length).fill(null)
      const rowOffset = Math.floor(r / 2)
      const rowWidth = row.length * parameters.width

      // Using the "odd-r" offset system. Each odd row moves to the right by 1/2 column width
      const startingOffsetX =
        center.x - rowWidth / 2 + (r % 2 === 0 ? 0 : parameters.inradius)

      for (let c = 0; c < row.length; c++) {
        const axial = new CubeCoordinates(c - rowOffset, r)
        const offset = new OffsetCoordinates(r, c)

        const layout = {
          row: r,
          column: c,
          startingOffsetX,
          startingOffsetY
        }

        const state = row[c]
        if (!state) {
          continue
        }

        const tile = new Tile({ axial, offset }, layout, parameters, state)

        this.layers.tiles.addChild(tile.group)

        if (tile.items.length) {
          this.items.push(...tile.items)
          this.layers.items.addChildren(tile.items.map((item) => item.group))
        }

        this.tiles.push(tile)

        rowByAxial[axial.q] = tile
        rowByOffset[offset.c] = tile
      }

      this.#tilesByAxial.push(rowByAxial)
      this.#tilesByOffset.push(rowByOffset)
    }
  }

  getTileByAxial (axial) {
    return (this.#tilesByAxial[axial.r] || [])[axial.q]
  }

  getState () {
    // Tiles are defined by offset in the puzzle state
    return this.#tilesByOffset.map((row) => row.map((tile) => tile?.getState() || null))
  }

  getNeighboringTile (axial, direction) {
    return this.getTileByAxial(CubeCoordinates.neighbor(axial, getConvertedDirection(direction)))
  }
}
