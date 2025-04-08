import paper, { Layer, Point } from 'paper'
import { CubeCoordinates } from './coordinates/cube'
import { OffsetCoordinates } from './coordinates/offset'
import { Tile } from './items/tile'
import { Stateful } from './stateful'
import { Modifiers } from './modifiers'
import { View } from './view'
import { Schema } from './schema'

export class Layout extends Stateful {
  #offset
  #tiles = {}

  layers = {}
  modifiers = []
  offset
  parameters
  tiles = []
  width

  constructor (state = {}) {
    super(state)

    const tiles = state.tiles || {}

    // These layers will be added in the order they are defined
    this.layers.tiles = new Layer()
    this.layers.items = new Layer()

    Object.values(this.layers).forEach((layer) => paper.project.addLayer(layer))

    this.modifiers = (state.modifiers || [])
      .map((state, index) => Modifiers.factory(null, state, index))
      .filter((modifier) => modifier !== undefined)

    this.parameters = Tile.parameters(state.tile?.height)
    this.offset = state.offset ?? Layout.Offsets.OddRow
    this.#offset = new Point(this.offset === Layout.Offsets.EvenRow ? this.parameters.width / 2 : 0, 0)

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
    const center = this.getPoint(offset)
    const coordinates = { axial, offset }
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
    return new Point(paper.view.viewSize.divide(2))
  }

  getItems () {
    return this.tiles.flatMap((tile) => tile.items)
  }

  getOffset (point) {
    return CubeCoordinates.toOffsetCoordinates(
      CubeCoordinates.fromPoint(
        point.subtract(this.getCenter().add(this.#offset)),
        this.parameters.circumradius
      ))
  }

  getPoint (offset) {
    return OffsetCoordinates.toAxialCoordinates(offset)
      .toPoint(this.parameters.circumradius)
      .add(this.getCenter().add(this.#offset))
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

    const state = { offset: this.offset }

    if (Object.keys(tiles).length) {
      state.tiles = tiles
    }

    const modifiers = this.modifiers.map((modifier) => modifier.getState())
    if (modifiers.length) {
      state.modifiers = modifiers
    }

    return state
  }

  getTile (offset = {}) {
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
    this.tiles.forEach((tile) => tile.teardown())
    this.modifiers.forEach((modifier) => modifier.detach())
    Object.values(this.layers).forEach((layer) => layer.remove())
  }

  static Offsets = Object.freeze({
    EvenRow: 'even-row',
    OddRow: 'odd-row'
  })

  static Schema = Object.freeze({
    $id: Schema.$id('layout'),
    properties: {
      modifiers: Modifiers.Schema,
      offset: {
        enum: Object.values(Layout.Offsets),
        options: {
          enum_titles: ['Even rows', 'Odd rows']
        },
        type: 'string'
      },
      tiles: {
        options: {
          hidden: true
        },
        type: 'object'
      }
    },
    required: ['offset'],
    type: 'object'
  })
}
