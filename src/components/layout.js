import { CubeCoordinates } from './coordinates/cube';
import { OffsetCoordinates } from './coordinates/offset';
import { Point, view } from 'paper';
import { Tile } from './tile';

export class Layout {
  constructor(configuration) {
    const tileParameters = Tile.parameters(configuration.tileSize);
    const tilesConfiguration = configuration.tiles;

    const center = new Point(view.size.width / 2, view.size.height / 2);
    const height = tilesConfiguration.length * tileParameters.height;
    const startingOffsetY = center.y - height / 2;

    let tiles = [];

    for (let r = 0; r < tilesConfiguration.length; r++) {
      const rowConfiguration = tilesConfiguration[r];
      const rowOffset = Math.floor(r / 2);
      const rowWidth = rowConfiguration.length * tileParameters.width;
      const startingOffsetX =
        center.x - rowWidth / 2 + (r % 2 == 0 ? 0 : tileParameters.inradius);

      let row = new Array(rowConfiguration.length);
      for (let c = 0; c < rowConfiguration.length; c++) {
        const axialCoordinates = new CubeCoordinates(c - rowOffset, r);
        const offsetCoordinates = new OffsetCoordinates(r, c);

        const tileConfiguration = rowConfiguration[c];
        if (!tileConfiguration) {
          row[axialCoordinates.q] = null;
          continue;
        }

        const layoutParameters = {
          row: r,
          column: c,
          startingOffsetX,
          startingOffsetY
        };

        const tile = new Tile(
          axialCoordinates,
          offsetCoordinates,
          layoutParameters,
          tileParameters,
          tileConfiguration,
          (direction) => {
            return this.getNeighboringTile(tile, direction);
          }
        );

        row[axialCoordinates.q] = tile;
      }

      tiles.push(row);
    }

    this.tiles = tiles;
  }

  getTileByAxial(axial) {
    return (this.tiles[axial.r] || [])[axial.q];
  }

  getTileByOffset(offset) {
    return this.getTileByAxial(OffsetCoordinates.toAxialCoordinates(offset));
  }

  getNeighboringTile(tile, direction) {
    return this.getTileByAxial(
      CubeCoordinates.neighbor(tile.axialCoordinates, direction)
    );
  }
}
