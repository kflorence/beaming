import { Beam } from './beam';
import { CubeCoordinates } from './coordinates/cube';
import { Layout } from './layout';
import { OffsetCoordinates } from './coordinates/offset';
import paper from 'paper';
import { Reflector } from './reflector';
import { Terminus } from './terminus';

export class Puzzle {
  constructor(configuration) {
    const tileSize = configuration.layout.tileSize;

    let layout = new Layout(configuration.layout);

    let reflectors = [];
    for (let i = 0; i < configuration.objects.reflectors.length; i++) {
      const reflectorConfiguration = configuration.objects.reflectors[i];
      const tile = layout.getTileByOffset(
        new OffsetCoordinates(...reflectorConfiguration.offsetCoordinates)
      );
      const reflector = new Reflector(tile, reflectorConfiguration);
      tile.objects.reflector = reflector;
      reflectors.push(reflector);
    }

    let beams = [];
    let terminuses = [];
    for (let i = 0; i < configuration.objects.terminuses.length; i++) {
      const terminusConfiguration = configuration.objects.terminuses[i];
      const tile = layout.getTileByOffset(
        new OffsetCoordinates(...terminusConfiguration.offsetCoordinates)
      );
      const terminus = new Terminus(tile, terminusConfiguration);
      tile.objects.terminus = terminus;
      terminuses.push(terminus);
      beams.push(
        ...terminus.openings.map((direction) => {
          return new Beam(terminus, { direction });
        })
      );
    }

    this.beams = beams;
    this.layout = layout;
    this.reflectors = reflectors;
    this.terminuses = terminuses;
    this.tileSize = tileSize;
    this.selectedTile = null;

    paper.view.onClick = (event) => {
      let tile;
      const hit = paper.project.hitTest(event.point);
      if (hit && hit.item.data.type == "tile") {
        const [q, r] = hit.item.data.axialId.split(",");
        tile = layout.getTileByAxial(new CubeCoordinates(q, r));
      }
      this.onClick(event, tile);
    };
  }

  onClick(event, tile) {
    console.log(tile);

    if (tile) {
      // A selected tile was clicked
      if (tile == this.selectedTile) {
        if (tile.objects.reflector) {
          tile.objects.reflector.onClick(event);
          this.beams.forEach((beam) => {
            beam.update();
          });
        }
      }

      // An un-selected tile was clicked
      else {
        if (this.selectedTile) {
          this.selectedTile.onUnselected(event);
        }
        this.selectedTile = tile;
        this.selectedTile.onSelected(event);
      }

      if (tile.objects.terminus) {
        tile.objects.terminus.onClick(event);
      }

      tile.objects.beams.forEach((beam) => beam.update());
    }

    // Something other than a tile was clicked
    else if (this.selectedTile) {
      this.selectedTile.onUnselected(event);
      this.selectedTile = null;
    }
  }
}

