import paper, { Layer, Point } from 'paper'
import { CubeCoordinates } from './coordinates/cube'
import { OffsetCoordinates } from './coordinates/offset'
import { Tile } from './items/tile'
import { Stateful } from './stateful'
import { Modifiers } from './modifiers'
import { View } from './view'
import { Schema } from './schema'
import { State } from './state.js'
import { Puzzles } from '../puzzles/index.js'
import { Imports } from './import.js'
import { classToString } from './util.js'

export class Layout extends Stateful {
  #imports = {}
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

    // Remove all previously imported tiles from state, they will be re-added below. This will ensure that any tiles
    // that were previously imported but deleted in the imported puzzle will be removed.
    for (const r in tiles) {
      const row = tiles[r]
      for (const c in row) {
        if (row[c].ref) {
          delete tiles[r][c]
        }
      }
    }

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

    const imports = state.imports || []
    for (const i of imports) {
      console.debug(Layout.toString(), `importing from puzzle ${i.id}`)

      const state = Puzzles.has(i.id) ? State.fromConfig(i.id) : State.fromCache(i.id)
      if (!state) {
        throw new Error(`Could not resolve import: ${i.id} -- invalid ID.`)
      }

      // Cloning will squash any history into the base config
      const config = state.clone().getConfig()
      for (const r in config.layout.tiles) {
        const row = config.layout.tiles[r]
        for (const c in row) {
          // FIXME: this doesn't correctly place tiles currently, even though the math makes sense.
          // For example, when importing a cluster of three tiles at [-1,-1], [0,0] and [-1,0] with an offset of [1,1],
          // the tile at [0,0] gets shifted to [1,1] but visually it should be at [1,0].
          const offsetC = Number(c) + Number(i.offset.c)
          const offsetR = Number(r) + Number(i.offset.r)

          const tile = tiles[offsetR]?.[offsetC]
          if (tile) {
            if (tile.ref === i.id) {
              console.debug(
                Layout.toString(),
                `Ignoring tile from puzzle '${i.id}' at '${offsetR},${offsetC}' as it has already been imported.`)
              continue
            }
            throw new Error(
              `Collision with parent detected when importing from puzzle '${i.id}' at '${offsetR},${offsetC}'.`)
          }

          // Keep a reference in tile state to the puzzle it was imported from
          row[c].ref = i.id
          tiles[offsetR] ??= {}
          tiles[offsetR][offsetC] = row[c]
          console.debug(Layout.toString(), `Imported tile from puzzle '${i.id}' at '${offsetR},${offsetC}'.`)
        }
      }
    }

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
    const config = super.getState()

    this.#imports = {}

    if (config.imports) {
      // Update imports cache
      config.imports.forEach((i) => { this.#imports[i.id] = i })
    }

    const tiles = {}

    for (const r in this.#tiles) {
      const row = this.#tiles[r]
      for (const c in row) {
        const tile = row[c].getState()
        console.log(tile, this.#imports[tile.ref])
        // Don't include tiles in the state if their associated import was removed
        if (!(tile.ref && !this.#imports[tile.ref])) {
          console.log('got here')
          tiles[r] ??= {}
          tiles[r][c] = tile
        }
      }
    }

    const state = { offset: this.offset }

    if (config.imports?.length) {
      state.imports = config.imports
    }

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

  isImported (tile) {
    return tile.ref && this.#imports[tile.ref]
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
      offset: {
        enum: Object.values(Layout.Offsets),
        options: {
          enum_titles: ['Even rows', 'Odd rows']
        },
        type: 'string'
      },
      modifiers: Modifiers.Schema,
      imports: Imports.Schema,
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

  static toString = classToString('Layout')
}
