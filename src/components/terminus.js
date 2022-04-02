import { Group, Path, Point, Size } from 'paper';
import { Tile } from './tile';

export class Terminus {
  constructor(tile, configuration) {
    const ui = Terminus.ui(tile, configuration);

    this.activated = configuration.activated;
    this.center = tile.center;
    this.connectedTerminus = null;
    this.openings = configuration.openings;
    this.tile = tile;
    this.ui = ui;
  }

  activate() {
    this.activated = true;
    this.update();
  }

  deactivate() {
    this.activated = false;
    this.update();
  }

  update() {
    this.ui.hexagon.opacity = this.activated ? 1 : 0.5;
  }

  static ui(tile, configuration) {
    const { color, openings } = configuration;

    const parameters = Tile.parameters(tile.parameters.circumradius);
    const hexagon = new Path.RegularPolygon({
      center: tile.center,
      fillColor: color,
      opacity: 0.5,
      radius: parameters.circumradius,
      sides: 6
    });

    const cavity = new Path.Circle({
      center: tile.center,
      closed: true,
      fillColor: "white",
      radius: parameters.circumradius / 2
    });

    const openingWidth = parameters.circumradius / 4;

    const paths = openings.map((direction) => {
      const topLeft = tile.center.subtract(new Point(0, openingWidth / 2));
      let opening = new Path.Rectangle({
        fillColor: "white",
        point: topLeft,
        size: new Size(parameters.inradius + 1, openingWidth)
      });

      opening.rotate(direction * 60, opening.bounds.leftCenter);

      return opening;
    });

    const group = new Group({
      children: [hexagon, cavity].concat(paths),
      locked: true
    });

    return {
      color,
      hexagon,
      paths,
      parameters,
      cavity,
      openings,
      openingWidth,
      group
    };
  }
}
