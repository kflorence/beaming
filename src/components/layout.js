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
import { arrayMergeUniqueById, classToString, emitEvent, hexagon, merge, removeEmpties } from './util.js'
import { ModifierFilter } from './modifier.js'
import { Storage } from './storage.js'
import { Flags } from './flag.js'

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

    this.#imports = {}
    state.importsCache ??= {}
    state.imports ??= []
    const importConfigs = {}
    for (const ref of state.imports) {
      const { id, offset } = ref
      console.debug(Layout.toString(), `Importing from puzzle ${id}, offset [${offset.r},${offset.c}]`, ref)

      this.#imports[id] = structuredClone(ref)

      const source = this.getCached(id, state)
      if (!source) {
        throw new Error(`Could not resolve import for puzzle ID '${id}'.`)
      }

      console.debug(Layout.toString(), `Resolved source for puzzle ID '${id}'`, source)

      if (ref.cache === true) {
        // Include the imported puzzle's configuration in the current puzzle's configuration.
        // This is only necessary for custom puzzles, since official puzzles can be loaded from configuration.
        // Note: cloning here will cause any history to get squashed into the base config
        state.importsCache[id] = source.clone().encode()
      } else {
        delete state.importsCache[id]
      }

      const config = importConfigs[id] = source.getCurrent()
      if (!config.layout) {
        // Generally indicates a problem
        console.warn(Layout.toString(), `Resolved config has no layout for puzzle ID '${id}'`)
      }

      const importFilters = (ref.filters ?? []).map((filter) => ImportFilter.factory(filter))
      const itemFilters = importFilters.filter((filter) => filter.type === ImportFilter.Types.Item)
      const modifierFilters = importFilters.filter((filter) => filter.type === ImportFilter.Types.Modifier)
      const tileFilters = importFilters.filter((filter) => filter.type === ImportFilter.Types.Tile)

      const excludeImport = !importFilters
        .filter((filter) => filter.type === ImportFilter.Types.Puzzle)
        .every((filter) => filter.apply(source, ref))
      if (excludeImport) {
        console.debug(Layout.toString(), `Excluding tiles from import '${ref.id}' due to failed puzzle filter`)
      }

      // Need to convert offsets into cube/axial coordinates to generate the proper offsets for each tile below.
      // This is because the offsets cannot be applied statically across tiles, because they are different depending
      // on where in the grid the tile is located (due to the even/odd offsetting of tiles).
      const anchorAxial = OffsetCoordinates.toAxialCoordinates(new OffsetCoordinates(ref.offset.r, ref.offset.c))

      config.layout ??= {}
      config.layout.tiles ??= []
      for (const r in config.layout.tiles) {
        const row = config.layout.tiles[r]
        for (const c in row) {
          const tileOffset = new OffsetCoordinates(Number(r), Number(c))
          const tileAxial = OffsetCoordinates.toAxialCoordinates(tileOffset)
          const translatedOffset = CubeCoordinates.toOffsetCoordinates(anchorAxial.add(tileAxial))

          const existing = tiles[translatedOffset.r]?.[translatedOffset.c]
          if (existing && existing.ref?.id !== ref.id) {
            throw new Error(`Collision detected when importing tile from puzzle '${ref.id}' to '${translatedOffset}'.`)
          }

          const tile = row[c]
          const flags = new Flags()

          if (excludeImport) {
            flags.add(Tile.Flags.Hidden)
          }

          if (!ref.unlocked || !tileFilters.every((filter) => filter.apply(source, tileOffset, tile))) {
            flags.add(Tile.Flags.Placeholder)
          }

          tile.flags = flags.get()

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

          // Merge the base configuration with any existing configuration
          const state = merge(tile, existing || {}, { arrayMerge: arrayMergeUniqueById })

          // Keep a reference to the puzzle and location the tile was imported from in state
          state.ref = { id: ref.id, offset: { r: tileOffset.r, c: tileOffset.c } }

          tiles[translatedOffset.r] ??= {}
          tiles[translatedOffset.r][translatedOffset.c] = state
          console.debug(Layout.toString(), `Imported tile from puzzle '${ref.id}' to '${translatedOffset}'.`)
        }
      }
    }

    for (const r in tiles) {
      const row = tiles[r]
      for (const c in row) {
        const state = row[c]
        if (state.ref && !importConfigs[state.ref.id]?.layout.tiles[state.ref.offset.r]?.[state.ref.offset.c]) {
          // The tile references an import or location that doesn't exist anymore
          continue
        }

        this.addTile(new OffsetCoordinates(r, c), state)
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
    const tile = new Tile(this, coordinates, center, this.parameters, state)

    this.#tiles[offset.r] ??= {}
    this.#tiles[offset.r][offset.c] = tile

    this.tiles.push(tile)

    this.layers.tiles.addChild(tile.group)

    if (tile.items.length) {
      this.layers.items.addChildren(tile.items.map((item) => item.group))
    }

    return tile
  }

  getCached (id, state) {
    // Gather the source cache for the puzzle from storage first, followed by config, and finally from puzzle cache
    // This will ensure the latest version is always used.
    return State.fromCache(id) ||
      State.fromConfig(id) ||
      State.fromEncoded((state ?? this.getState()).importsCache[id])
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
        tiles[r] ??= {}
        tiles[r][c] = row[c].getState()
      }
    }

    return removeEmpties({
      imports: Object.values(this.#imports),
      importsCache: config.importsCache,
      modifiers: this.modifiers.map((modifier) => modifier.getState()),
      offset: this.offset,
      tiles
    })
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

    const cache = this.getCached(id)
    const key = State.key(id)

    if (cache && !Storage.get(key)) {
      // Ensure a cache entry exists for this puzzle. This is necessary for custom import puzzles
      Storage.set(key, cache.encode())
      State.add(id)
    }

    const filters = ref?.filters?.map((filter) => ImportFilter.factory(filter)) ?? []

    const hide = !filters
      .filter((filter) => filter.type === ImportFilter.Types.Puzzle)
      .every((filter) => filter.apply(cache, ref))

    const tileFilters = filters.filter((filter) => filter.type === ImportFilter.Types.Tile)

    const tiles = this.tiles.filter((tile) => tile.ref?.id === id)
    tiles.forEach((tile) => {
      // Re-evaluate unlocked tiles
      const offset = new OffsetCoordinates(tile.ref.offset.r, tile.ref.offset.c)
      tile.flags.toggle(Tile.Flags.Placeholder, !tileFilters.every((filter) => filter.apply(cache, offset, tile)))
      tile.flags.toggle(Tile.Flags.Hidden, hide)
      tile.update()
    })

    // Re-evaluate modifiers
    this.#updateModifiers()

    emitEvent(Layout.Events.TilesUnlocked, { tiles })
  }

  #updateModifiers () {
    this.modifiers.forEach((modifier) => {
      // Mark modifiers which fail a filter as locked
      modifier.unlocked = (modifier.getState().filters ?? [])
        .map((filter) => ModifierFilter.factory(filter))
        .every((filter) => filter.apply(this))
    })
  }

  static Events = Object.freeze({
    TilesUnlocked: 'tiles-unlocked'
  })

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
