import { movable } from '../modifiers/move'
import { Item } from '../item'
import { Group, Path, Point } from 'paper'
import { rotatable } from '../modifiers/rotate'

export class Portal extends movable(rotatable(Item)) {
  rotateDegrees = 60
  type = Item.Types.filter

  constructor (tile, configuration) {
    super(...arguments)

    const height = tile.parameters.circumradius / 3
    const width = tile.parameters.circumradius / 5

    const style = {
      fillColor: 'black',
      strokeColor: 'white',
      strokeWidth: 2
    }

    const ellipse = new Path.Ellipse({
      center: tile.center,
      radius: [width, height],
      style
    })

    const ring = new Path.Ellipse({
      center: tile.center,
      radius: [width - style.strokeWidth * 2, height - style.strokeWidth * 2],
      style
    })

    const pointer = new Path({
      closed: true,
      opacity: 0.25,
      segments: [
        tile.center.add(new Point(0, height)),
        tile.center.subtract(new Point(0, height)),
        tile.center.subtract(new Point(width * 2.5, 0))
      ],
      style: {
        fillColor: 'black'
      }
    }).subtract(ellipse)

    this.group = new Group({
      children: [pointer, ellipse, ring],
      // Allow this group to be clicked on
      locked: false
    })

    this.doRotate(configuration.direction + 1)
  }

  // TODO
  onCollision (beam, collision, currentStep, nextStep, collisionStep) {
    return collisionStep
  }
}
