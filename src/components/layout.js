import paper, { Layer, Point } from 'paper'
import { CubeCoordinates } from './coordinates/cube'
import { OffsetCoordinates } from './coordinates/offset'
import { Tile } from './items/tile'
import { Stateful } from './stateful'
import { modifierFactory } from './modifierFactory'

export class Layout extends Stateful {
  #tilesByAxial = []
  #tilesByOffset = []

  center
  height
  items = []
  layers = {}
  modifiers = []
  offset
  parameters
  tiles = []
  width
  widestRow

  constructor (state = {}) {
    super(state)

    const tiles = state.tiles || []

    this.center = paper.view.center
    this.layers.tiles = new Layer()
    this.layers.items = new Layer()

    this.modifiers = (state.modifiers || [])
      .map((state, index) => modifierFactory(null, state, index))
      .filter((modifier) => modifier !== undefined)

    this.parameters = Tile.parameters(state.tile?.height)
    this.type = state.type || Layout.Types.oddR

    // Find the widest row
    this.widestRow = tiles.reduce((current, row, index) => {
      const length = row.length

      // Favor offset rows, since they will be wider
      if (length > current.length || (length === current.length && this.#isOffsetRow(index))) {
        return { index, length }
      }

      return current
    }, { index: 0, length: 0 })

    this.width = (this.widestRow.length * this.parameters.width) +
      (this.#isOffsetRow(this.widestRow.index) ? this.parameters.inradius : 0)

    // Using parameters.width because we want the "stacked height", or the height of the hexagon without the points.
    this.height = tiles.length * this.parameters.width

    this.offset = this.center.subtract(new Point(this.width, this.height).divide(2))

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
          offset: this.#isOffsetRow(r) ? this.offset.add(new Point(this.parameters.inradius, 0)) : this.offset
        }

        const state = row[c]
        if (!state) {
          continue
        }

        const tile = new Tile({ axial, offset }, layout, this.parameters, state)

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

  getTileByAxial (axial) {
    return (this.#tilesByAxial[axial.r] || [])[axial.q]
  }

  getTileByOffset (offset) {
    return this.#tilesByOffset[offset.r][offset.c]
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
