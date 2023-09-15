import { Group, Path, Point, Size } from 'paper'
import { Buttons } from '../util'
import { Item } from '../item'

export class Reflector extends Item {
  constructor (tile, configuration) {
    super(tile, configuration)

    const length = tile.parameters.circumradius
    const width = tile.parameters.circumradius / 12
    const topLeft = tile.center.subtract(new Point(width / 2, length / 2))

    const wall = new Path.Rectangle({
      fillColor: 'black',
      point: topLeft,
      size: new Size(width, length)
    })

    // let directionality = new Path.Line({
    //   from: tile.center,
    //   strokeColor: "red",
    //   strokeWidth: 1,
    //   to: tile.center.add(new Point(tile.parameters.inradius / 2, 0))
    // });

    const group = new Group({
      children: [wall],
      locked: true
    })

    group.rotate(configuration.direction * 30, wall.bounds.center)

    this.direction = configuration.direction
    this.group = group
    this.wall = wall
  }

  onClick (event) {
    const direction = event.event.button === Buttons.Left ? -1 : 1

    // The reflector rotates like the hands on a clock. Zero and twelve are equal.
    if (direction < 0 && this.direction === 0) {
      this.direction = 11
    } else if (direction > 0 && this.direction === 12) {
      this.direction = 1
    } else {
      this.direction += direction
    }

    this.group.rotate(direction * 30, this.wall.bounds.center)
  }
}
