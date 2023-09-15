import { CubeCoordinates } from './coordinates/cube'
import { OffsetCoordinates } from './coordinates/offset'
import { Layer, Point, view } from 'paper'
import { Tile } from './tile'

export class Layout {
  constructor (configuration) {
    const tileParameters = Tile.parameters(configuration.tileSize)
    const tilesConfiguration = configuration.tiles

    const center = new Point(view.size.width / 2, view.size.height / 2)
    const height = tilesConfiguration.length * tileParameters.height
    const startingOffsetY = center.y - height / 2

    const tiles = []

    this.layer = new Layer()

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
          row[axialCoordinates.q] = null
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

        this.layer.addChild(tile.group)

        row[axialCoordinates.q] = tile
      }

      tiles.push(row)
    }

    this.tiles = tiles
  }

  getTileByAxial (axial) {
    return (this.tiles[axial.r] || [])[axial.q]
  }

  getTileByOffset (offset) {
    return this.getTileByAxial(OffsetCoordinates.toAxialCoordinates(offset))
  }

  getNeighboringTile (axial, direction) {
    return this.getTileByAxial(CubeCoordinates.neighbor(axial, direction))
  }
}
