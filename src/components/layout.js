import { CubeCoordinates } from './coordinates/cube'
import { OffsetCoordinates } from './coordinates/offset'
import { Layer, Point, view } from 'paper'
import { Tile } from './items/tile'
import { Item } from './item'
import { getConvertedDirection } from './util'

export class Layout {
  beams = []
  items = []
  layers = {}
  tiles = []
  tileSize = 100

  constructor (configuration) {
    const tileParameters = Tile.parameters(this.tileSize)
    const tilesConfiguration = configuration.tiles

    const center = new Point(view.size.width / 2, view.size.height / 2)
    const height = tilesConfiguration.length * tileParameters.height
    const startingOffsetY = center.y - height / 2

    this.layers.tiles = new Layer()
    this.layers.beams = new Layer()
    this.layers.items = new Layer()
    this.layers.debug = new Layer()

    for (let r = 0; r < tilesConfiguration.length; r++) {
      const rowConfiguration = tilesConfiguration[r]
      const rowOffset = Math.floor(r / 2)
      const rowWidth = rowConfiguration.length * tileParameters.width
      const startingOffsetX =
        center.x - rowWidth / 2 + (r % 2 === 0 ? 0 : tileParameters.inradius)

      const row = new Array(rowConfiguration.length)
      for (let c = 0; c < rowConfiguration.length; c++) {
        const axialCoordinates = new CubeCoordinates(c - rowOffset, r)
        const offsetCoordinates = new OffsetCoordinates(r, c)

        const tileConfiguration = rowConfiguration[c]
        if (!tileConfiguration) {
          continue
        }

        const tile = new Tile({
          coordinates: {
            axial: axialCoordinates,
            offset: offsetCoordinates
          },
          layout: {
            row: r,
            column: c,
            startingOffsetX,
            startingOffsetY
          },
          parameters: tileParameters,
          configuration: tileConfiguration
        })

        this.layers.tiles.addChild(tile.group)

        if (tile.items.length) {
          const beams = tile.items
            .filter((item) => item.type === Item.Types.terminus)
            .flatMap((terminus) => terminus.beams)

          this.beams.push(...beams)
          this.layers.beams.addChildren(beams.map((beam) => beam.group))

          this.items.push(...tile.items)
          this.layers.items.addChildren(tile.items.map((item) => item.group))
        }

        row[axialCoordinates.q] = tile
      }

      this.tiles.push(row)
    }
  }

  getTile (axial) {
    return (this.tiles[axial.r] || [])[axial.q]
  }

  getNeighboringTile (axial, direction) {
    return this.getTile(CubeCoordinates.neighbor(axial, getConvertedDirection(direction)))
  }
}
