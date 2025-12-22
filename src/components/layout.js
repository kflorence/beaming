import paper, { Layer, Point } from 'paper'
import { CubeCoordinates } from './coordinates/cube'
import { OffsetCoordinates } from './coordinates/offset'
import { Tile } from './items/tile'
import { Stateful } from './stateful'
import { Modifiers } from './modifiers'
import { View } from './view'
import { Schema } from './schema'
import { State } from './state.js'
import { ImportFilter, Imports } from './import.js'
import { classToString, params } from './util.js'

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

    // Remove any previously imported tiles from state.
    const imports = {}
    for (const r in tiles) {
      const row = tiles[r]
      for (const c in row) {
        const ref = row[c].ref
        if (ref) {
          const tile = tiles[r][c]
          // Keep a reference to the previous state of the tile, at its location in the puzzle that owns it, so it can
          // be carried over if the tile is still being imported
          imports[ref.id] ??= {}
          imports[ref.id][ref.offset.r] ??= {}
          imports[ref.id][ref.offset.r][ref.offset.c] = tile
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
    this.#imports = {}

    state.importsCache ??= {}
    state.imports ??= []
    for (const imp of state.imports) {
      const { id, offset } = imp
      console.debug(Layout.toString(), `importing from puzzle ${id}, offset ${offset}`)

      this.#imports[id] = imp

      // Gather the source cache for the puzzle from storage first, followed by config, and finally from puzzle cache
      // This will ensure the latest version will always get cached in the puzzle if cache is true.
      // Note: cloning here will cause any history to get squashed into the base config
      const source = (
        State.fromCache(id) ||
        State.fromConfig(id) ||
        State.fromEncoded(state.importsCache[id])
      ).clone()

      const config = source.getConfig()
      if (!config.layout) {
        throw new Error(`Could not resolve import for puzzle ID '${id}'.`)
      }

      // Need to convert offsets into cube/axial coordinates to generate the proper offsets for each tile below.
      // This is because the offsets cannot be applied statically across tiles, because they are different depending
      // on where in the grid the tile is located (due to the even/odd offsetting of tiles).
      const anchorAxial = OffsetCoordinates.toAxialCoordinates(new OffsetCoordinates(offset.r, offset.c))

      if (imp.cache === true) {
        // Include the imported puzzle's configuration in the current puzzle's configuration.
        // This is only necessary for custom puzzles, since official puzzles can be loaded from configuration.
        state.importsCache[id] = source.encode()
      } else {
        delete state.importsCache[id]
      }

      const filters = (imp.filters ?? []).map((filter) => ImportFilter.factory(filter))
      if (
        filters
          .filter((filter) => filter.type === ImportFilter.Types.Condition)
          .some((condition) => !condition.apply(config))
      ) {
        // If any condition fails, nothing will be imported.
        continue
      }

      // const tileFilters = filters.filter((filter) => filter.type === ImportFilter.Types.Tile)

      for (const r in config.layout.tiles) {
        const row = config.layout.tiles[r]
        for (const c in row) {
          const tileOffset = new OffsetCoordinates(Number(r), Number(c))
          const tileAxial = OffsetCoordinates.toAxialCoordinates(tileOffset)
          const translatedOffset = CubeCoordinates.toOffsetCoordinates(anchorAxial.add(tileAxial))

          if (tiles[translatedOffset.r]?.[translatedOffset.c]) {
            throw new Error(`Collision detected when importing tile from puzzle '${id}' to '${translatedOffset}'.`)
          }

          // Carry over any previous state changes for the tile
          const tile = Object.assign(row[c], imports[id]?.[tileOffset.r]?.[tileOffset.c] || {})

          // TODO filter tiles

          // Keep a reference to the puzzle and location the tile was imported from in state
          tile.ref = { id, offset: { r: tileOffset.r, c: tileOffset.c } }
          tiles[translatedOffset.r] ??= {}
          tiles[translatedOffset.r][translatedOffset.c] = tile
          console.debug(Layout.toString(), `Imported tile from puzzle '${id}' to '${translatedOffset}'.`)
        }
      }
    }

    for (const r in tiles) {
      const row = tiles[r]
      for (const c in row) {
        this.addTile(new OffsetCoordinates(r, c), row[c])
      }
    }

    this.setState(state)

    View.update()
  }

  addTile (offset, state = {}) {
    this.removeTile(offset)

    if (params.has(State.ParamKeys.Edit) && state.ref) {
      const config = this.#imports[state.ref.id]
      if (config.color) {
        state.style = {
          default: {
            fillColor: config.color
          }
        }
      }
    }

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

    const tiles = {}

    for (const r in this.#tiles) {
      const row = this.#tiles[r]
      for (const c in row) {
        tiles[r] ??= {}
        tiles[r][c] = row[c].getState()
      }
    }

    const state = { offset: this.offset }

    if (config.imports.length) {
      state.imports = config.imports
    }

    if (Object.keys(config.importsCache).length) {
      state.importsCache = config.importsCache
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
      tiles: {
        options: {
          hidden: true
        },
        type: 'object'
      },
      imports: Imports.Schema,
      importsCache: {
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
