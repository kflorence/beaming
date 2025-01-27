import paper, { Layer } from 'paper'
import { CubeCoordinates } from './coordinates/cube'
import { OffsetCoordinates } from './coordinates/offset'
import { Tile } from './items/tile'
import { Stateful } from './stateful'
import { modifierFactory } from './modifierFactory'
import { View } from './view'

export class Layout extends Stateful {
  #tiles = {}

  layers = {}
  modifiers = []
  parameters
  tiles = []

  constructor (state = {}) {
    super(state)

    const tiles = state.tiles || {}

    this.layers.items = new Layer()
    this.layers.tiles = new Layer()

    this.modifiers = (state.modifiers || [])
      .map((state, index) => modifierFactory(null, state, index))
      .filter((modifier) => modifier !== undefined)

    this.parameters = Tile.parameters(state.tile?.height)

    for (const r in tiles) {
      const row = tiles[r]
      for (const c in row) {
        const offset = new OffsetCoordinates(r, c)
        const state = row[c]

        this.addTile(offset, state)
      }
    }

    View.update()
  }

  addTile (offset, state) {
    this.removeTile(offset)

    const rowOffset = Math.floor(offset.r / 2)
    const axial = new CubeCoordinates(offset.c - rowOffset, offset.r)
    const coordinates = { axial, offset }
    const center = axial.toPoint(this.parameters.circumradius).add(this.getCenter())
    const tile = new Tile(coordinates, center, this.parameters, state)

    this.#tiles[offset.r] ??= {}
    this.#tiles[offset.r][offset.c] = tile

    this.tiles.push(tile)

    this.layers.tiles.addChild(tile.group)

    if (tile.items.length) {
      this.layers.items.addChildren(tile.items.map((item) => item.group))
    }

    return tile
  }

  getCenter () {
    // The center of the canvas
    return paper.view.viewSize.divide(2)
  }

  getOffset (point) {
    return CubeCoordinates.toOffsetCoordinates(
      CubeCoordinates.fromPoint(point.subtract(this.getCenter()), this.parameters.circumradius))
  }

  getPoint (offset) {
    return OffsetCoordinates.toAxialCoordinates(offset).toPoint(this.parameters.circumradius).add(this.getCenter())
  }

  getState () {
    const tiles = {}

    for (const r in this.#tiles) {
      const row = this.#tiles[r]
      tiles[r] ??= {}
      for (const c in row) {
        tiles[r][c] = row[c].getState()
      }
    }

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

  removeTile (offset) {
    const tile = this.getTile(offset)
    if (!tile) {
      return
    }

    tile.teardown()

    this.tiles.splice(this.tiles.indexOf(tile), 1)

    delete this.#tiles[offset.r]?.[offset.c]
    if (Object.keys(this.#tiles[offset.r]).length === 0) {
      delete this.#tiles[offset.r]
    }
  }

  teardown () {
    this.modifiers.forEach((modifier) => modifier.detach())
    Object.values(this.layers).forEach((layer) => layer.removeChildren())
  }
}
