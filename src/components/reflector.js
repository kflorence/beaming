import { Group, Path, Point, Size } from 'paper';

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
    this.direction = this.direction == 11 ? 0 : this.direction + 1;
    this.group.rotate(30, this.wall.bounds.center);
  }
}
