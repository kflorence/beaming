import { Group, Path, Point, Size } from 'paper';
import { Buttons } from "./util";

export class Reflector {
  constructor(tile, configuration) {
    const length = tile.parameters.circumradius;
    const width = tile.parameters.circumradius / 12;
    const topLeft = tile.center.subtract(new Point(width / 2, length / 2));

    let wall = new Path.Rectangle({
      fillColor: "black",
      point: topLeft,
      radius: 2,
      size: new Size(width, length)
    });

    // let directionality = new Path.Line({
    //   from: tile.center,
    //   strokeColor: "red",
    //   strokeWidth: 1,
    //   to: tile.center.add(new Point(tile.parameters.inradius / 2, 0))
    // });

    let group = new Group({
      children: [wall /*, directionality*/],
      locked: true
    });

    group.rotate(configuration.direction * 30, wall.bounds.center);

    this.direction = configuration.direction;
    this.group = group;
    this.tile = tile;
    this.wall = wall;
  }

  onClick(event) {
    const direction = event.event.button === Buttons.Left ? -1 : 1;

    // The reflector rotates like the hands on a clock. Zero and twelve are equal.
    if (direction < 0 && this.direction === 0) {
      this.direction = 11;
    } else if (direction > 0 && this.direction === 12) {
      this.direction = 1;
    } else {
      this.direction += direction;
    }

    this.group.rotate(direction * 30, this.wall.bounds.center);
  }
}
