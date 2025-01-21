import paper, { Layer } from 'paper'
import { CubeCoordinates } from './coordinates/cube'
import { OffsetCoordinates } from './coordinates/offset'
import { Tile } from './items/tile'
import { getConvertedDirection } from './util'
import { Stateful } from './stateful'
import { modifierFactory } from './modifierFactory'

export class Layout extends Stateful {
  #tilesByAxial = []
  #tilesByOffset = []

  items = []
  layers = {}
  modifiers = []
  tiles = []
  tileSize = 120

  constructor (state = {}) {
    super(state)

    this.type = state.type || Layout.Types.oddR

    const center = paper.view.center
    const parameters = Tile.parameters(this.tileSize)
    const tiles = state.tiles || []

    // Using parameters.width because we want the "stacked height", or the height of the hexagon without the points.
    const height = tiles.length * parameters.width
    const startingOffsetY = center.y - (height / 2)

    this.layers.tiles = new Layer()
    this.layers.items = new Layer()

    this.modifiers = (state.modifiers || [])
      .map((state, index) => modifierFactory(null, state, index))
      .filter((modifier) => modifier !== undefined)

    // Find the widest row
    const widestRow = tiles.reduce((current, row, index) => {
      const length = row.length

      // Favor offset rows, since they will be wider
      if (length > current.length || (length === current.length && this.#isOffsetRow(index))) {
        return { index, length }
      }

      return current
    }, { index: 0, length: 0 })

    const width = (widestRow.length * parameters.width) + (this.#isOffsetRow(widestRow.index) ? parameters.inradius : 0)
    const startingOffsetX = center.x - (width / 2)

    for (let r = 0; r < tiles.length; r++) {
      const row = tiles[r]
      const rowByAxial = new Array(row.length).fill(null)
      const rowByOffset = new Array(row.length).fill(null)
      const rowOffset = Math.floor(r / 2)

      for (let c = 0; c < row.length; c++) {
        const axial = new CubeCoordinates(c - rowOffset, r)
        const offset = new OffsetCoordinates(r, c)

        const layout = {
          row: r,
          column: c,
          // Shift row to the right if it is an offset row
          startingOffsetX: startingOffsetX + (this.#isOffsetRow(r) ? parameters.inradius : 0),
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

  getTileByOffset (offset) {
    return this.#tilesByOffset[offset.r][offset.c]
  }

  getState () {
    const state = { type: this.type }

    // Tiles are defined by offset in the puzzle state
    state.tiles = this.#tilesByOffset.map((row) => row.map((tile) => tile?.getState() || null))
    const modifiers = this.modifiers.map((modifier) => modifier.getState())
    if (modifiers.length) {
      state.modifiers = modifiers
    }

    return state
  }

  getNeighboringTile (axial, direction) {
    return this.getTileByAxial(CubeCoordinates.neighbor(axial, getConvertedDirection(direction)))
  }

  removeModifier (modifier) {
    const index = this.modifiers.indexOf(modifier)
    if (index >= 0) {
      this.modifiers.splice(index, 1)
    }
  }

  teardown () {
    this.modifiers.forEach((modifier) => modifier.detach())
    Object.values(this.layers).forEach((layer) => layer.removeChildren())
  }

  #isOffsetRow (index) {
    return index % 2 === 0 ? this.type === Layout.Types.evenR : this.type === Layout.Types.oddR
  }

  static Types = Object.freeze({
    evenR: 'even-r',
    oddR: 'odd-r'
  })
}
