import paper, { Layer } from 'paper'
import { CubeCoordinates } from './coordinates/cube'
import { OffsetCoordinates } from './coordinates/offset'
import { Tile } from './items/tile'
import { Stateful } from './stateful'
import { modifierFactory } from './modifierFactory'
import { View } from './view'

export class Layout extends Stateful {
  #tiles = {}

  center
  items = []
  layers = {}
  modifiers = []
  parameters
  tiles = []

  constructor (state = {}) {
    super(state)

    const tiles = state.tiles || {}

    // The tiles will always position themselves relative to the center of the canvas
    // This allows us to manipulate paper.view.center without affecting the tile center calculations
    this.center = paper.view.viewSize.divide(2)

    this.layers.tiles = new Layer()
    this.layers.items = new Layer()

    this.modifiers = (state.modifiers || [])
      .map((state, index) => modifierFactory(null, state, index))
      .filter((modifier) => modifier !== undefined)

    this.parameters = Tile.parameters(state.tile?.height)

    for (const r in tiles) {
      const row = tiles[r]
      const rowOffset = Math.floor(r / 2)

      this.#tiles[r] ??= {}

      for (const c in row) {
        const axial = new CubeCoordinates(c - rowOffset, r)
        const offset = new OffsetCoordinates(r, c)
        const center = axial.toPoint(this.parameters.circumradius).add(this.center)
        const tile = new Tile({ axial, offset }, center, this.parameters, row[c])

        this.layers.tiles.addChild(tile.group)

        if (tile.items.length) {
          this.items.push(...tile.items)
          this.layers.items.addChildren(tile.items.map((item) => item.group))
        }

        this.tiles.push(tile)

        this.#tiles[r][c] = tile
      }
    }

    View.update()
  }

  getState () {
    const tiles = {}

    Object.keys(this.#tiles).forEach((r) => {
      tiles[r] ??= {}
      Object.keys(this.#tiles[r]).forEach((c) => {
        tiles[r][c] = this.#tiles[r][c].getState()
      })
    })

    const state = { tiles }
    const modifiers = this.modifiers.map((modifier) => modifier.getState())
    if (modifiers.length) {
      state.modifiers = modifiers
    }

    return state
  }

  getTile (offset) {
    return this.#tiles[offset.r]?.[offset.c]
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
}
