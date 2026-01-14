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
import { classToString, hexagon } from './util.js'
import { Modifier, ModifierFilter } from './modifier.js'
import { Storage } from './storage.js'

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

    // These layers will be added in the order they are defined
    this.layers.tiles = new Layer()
    this.layers.items = new Layer()

    Object.values(this.layers).forEach((layer) => paper.project.addLayer(layer))

    this.parameters = hexagon(state.tile?.height ?? Tile.DefaultHeight)
    this.offset = state.offset ?? Layout.Offsets.OddRow
    this.#offset = new Point(this.offset === Layout.Offsets.EvenRow ? this.parameters.width / 2 : 0, 0)

    const puzzlesUnlocked = {}
    for (const r in tiles) {
      const row = tiles[r]
      for (const c in row) {
        const tile = row[c]
        // Every collected puzzle modifier represents a puzzle unlock
        const modifier = tile.modifiers?.find((modifier) => modifier.type === Modifier.Types.Puzzle)
        if (modifier) {
          console.debug(Layout.toString(), `Marking import as unlocked: ${modifier.puzzleId}`)
          puzzlesUnlocked[modifier.puzzleId] = true
        }
      }
    }

    this.#imports = {}
    state.importsCache ??= {}
    state.imports ??= []
    for (const ref of state.imports) {
      const { id, offset } = ref
      console.debug(Layout.toString(), `Importing from puzzle ${id}, offset [${offset.r},${offset.c}]`, ref)

      // Track if the user has unlocked this import
      ref.unlocked ??= puzzlesUnlocked[id]
      this.#imports[id] = structuredClone(ref)

      const source = this.getCache(id, state)
      if (!source) {
        throw new Error(`Could not resolve import for puzzle ID '${id}'.`)
      }

      console.debug(Layout.toString(), `Resolved source for puzzle ID '${id}'`, source)

      // Need to convert offsets into cube/axial coordinates to generate the proper offsets for each tile below.
      // This is because the offsets cannot be applied statically across tiles, because they are different depending
      // on where in the grid the tile is located (due to the even/odd offsetting of tiles).
      const anchorAxial = OffsetCoordinates.toAxialCoordinates(new OffsetCoordinates(offset.r, offset.c))

      if (ref.cache === true) {
        // Include the imported puzzle's configuration in the current puzzle's configuration.
        // This is only necessary for custom puzzles, since official puzzles can be loaded from configuration.
        // Note: cloning here will cause any history to get squashed into the base config
        state.importsCache[id] = source.clone().encode()
      } else {
        delete state.importsCache[id]
      }

      const importFilters = (ref.filters ?? []).map((filter) => ImportFilter.factory(filter))
      const placeholder = !ref.unlocked || !importFilters
        .filter((filter) => filter.type === ImportFilter.Types.Puzzle)
        .every((filter) => filter.apply(source))
      if (placeholder) {
        console.debug(Layout.toString(), `Marking import '${id}' as placeholder`)
      }

      const config = source.clone().getConfig()
      if (!config.layout) {
        // Generally indicates a problem
        console.warn(Layout.toString(), `Resolved config has no layout for puzzle ID '${id}'`)
      }

      config.layout ??= {}
      config.layout.tiles ??= []
      const itemFilters = importFilters.filter((filter) => filter.type === ImportFilter.Types.Item)
      const modifierFilters = importFilters.filter((filter) => filter.type === ImportFilter.Types.Modifier)
      const tileFilters = importFilters.filter((filter) => filter.type === ImportFilter.Types.Tile)
      for (const r in config.layout.tiles) {
        const row = config.layout.tiles[r]
        for (const c in row) {
          let tile = row[c]
          const tileOffset = new OffsetCoordinates(Number(r), Number(c))
          const tileAxial = OffsetCoordinates.toAxialCoordinates(tileOffset)
          const translatedOffset = CubeCoordinates.toOffsetCoordinates(anchorAxial.add(tileAxial))

          if (tiles[translatedOffset.r]?.[translatedOffset.c]) {
            // There is already a tile at this location
            throw new Error(`Collision detected when importing tile from puzzle '${id}' to '${translatedOffset}'.`)
          }

          const tileRef = ref.tiles?.[translatedOffset.r]?.[translatedOffset.c]
          if (tileRef) {
            // The user has made changes to this tile already
            tile = tileRef
          } else {
            if (tile.items) {
              // Items are excluded by default. Filters can be used to include them
              tile.items = itemFilters.length === 0
                ? []
                : tile.items.filter((item) => itemFilters.every((filter) => filter.apply(source, item)))
            }

            if (tile.modifiers) {
              // Modifiers are excluded by default. Filters can be used to include them
              tile.modifiers = modifierFilters.length === 0
                ? []
                : tile.modifiers.filter((item) => modifierFilters.every((filter) => filter.apply(source, item)))
            }

            // Keep a reference to the puzzle and location the tile was imported from in state
            tile.ref = { id, offset: { r: tileOffset.r, c: tileOffset.c } }
          }

          if (placeholder || !tileFilters.every((filter) => filter.apply(source, tileOffset, tile))) {
            console.debug(
              Layout.toString(),
              `Marking imported tile for import '${id}' at '${translatedOffset}' as placeholder due to failing filter`
            )
            tile.placeholder = true
          }

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

    state.modifiers ??= []
    this.modifiers = state.modifiers
      .map((state, index) => Modifiers.factory(null, state, index))
      .filter((modifier) => modifier !== undefined)

    this.setState(state)
    this.#updateModifiers()

    View.update()
  }

  addModifier (modifier) {
    const index = this.modifiers[this.modifiers.length - 1]?.index ?? 0
    modifier.index = index + 1
    this.modifiers.push(modifier)
    return this.modifiers
  }

  addTile (offset, state = {}) {
    this.removeTile(offset)

    if (state.ref) {
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

  getCache (id, state) {
    // Gather the source cache for the puzzle from storage first, followed by config, and finally from puzzle cache
    // This will ensure the latest version is always used.
    return State.fromCache(id) || State.fromConfig(id) || State.fromEncoded((state ?? this.getState()).importsCache[id])
  }

  getCenter () {
    // The center of the canvas
    return new Point(paper.view.viewSize.divide(2))
  }

  getImport (id) {
    return this.getImports()[id]
  }

  getImports () {
    return structuredClone(this.#imports)
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
    // This should only be referenced for things that are static
    const config = super.getState()

    const tiles = {}

    for (const r in this.#tiles) {
      const row = this.#tiles[r]
      for (const c in row) {
        const tile = row[c]
        if (!tile.ref) {
          // Only store non-imported tiles in state
          tiles[r] ??= {}
          tiles[r][c] = row[c].getState()
        }
      }
    }

    const state = { offset: this.offset }

    if (Object.keys(this.#imports).length) {
      state.imports = Object.values(this.#imports)
    }

    if (Object.keys(config.importsCache).length) {
      state.importsCache = config.importsCache
    }

    if (Object.keys(tiles).length) {
      state.tiles = tiles
    }

    if (this.modifiers.length) {
      state.modifiers = this.modifiers.map((modifier) => modifier.getState())
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

  unlock (id) {
    const ref = this.#imports[id]
    if (!ref) {
      return
    }

    ref.unlocked = true

    const cache = this.getCache(id)
    const key = State.key(id)

    if (cache && !Storage.get(key)) {
      // Ensure a cache entry exists for this puzzle. This is necessary for custom import puzzles
      Storage.set(key, cache)
      State.add(id)
    }

    const filters = ref?.filters?.map((filter) => ImportFilter.factory(filter)) ?? []
    const tileFilters = filters.filter((filter) => filter.type === ImportFilter.Types.Tile)

    // Re-evaluate unlocked tiles
    this.tiles.forEach((tile) => {
      if (tile.ref?.id === id) {
        const offset = new OffsetCoordinates(tile.ref.offset.r, tile.ref.offset.c)
        const placeholder = !tileFilters.every((filter) => filter.apply(cache, offset, tile))
        tile.update({ placeholder })
      }
    })

    // Re-evaluate modifiers
    this.#updateModifiers()
  }

  #updateModifiers () {
    this.modifiers.forEach((modifier) => {
      // Mark modifiers which fail a filter as locked
      modifier.unlocked = (modifier.getState().filters ?? [])
        .map((filter) => ModifierFilter.factory(filter))
        .every((filter) => filter.apply(this))
    })
  }

  static Offsets = Object.freeze({
    EvenRow: 'even-row',
    OddRow: 'odd-row'
  })

  static schema = () => Object.freeze({
    $id: Schema.$id('layout'),
    properties: {
      offset: {
        enum: Object.values(Layout.Offsets),
        options: {
          enum_titles: ['Even rows', 'Odd rows']
        },
        type: 'string'
      },
      modifiers: Modifiers.schema(),
      tiles: {
        options: {
          hidden: true
        },
        type: 'object'
      },
      imports: Imports.schema(),
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
