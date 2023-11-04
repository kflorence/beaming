import { movable } from '../modifiers/move'
import { Item } from '../item'
import { Group, Path, Point } from 'paper'
import { rotatable } from '../modifiers/rotate'
import { getOppositeDirection } from '../util'
import { Beam } from './beam'

export class Portal extends movable(rotatable(Item)) {
  direction
  rotateDegrees = 60
  type = Item.Types.portal

  constructor (tile, configuration, layout) {
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
      locked: true
    })

    this.direction = configuration.direction

    // Align with the hexagonal directions (0 = 5)
    this.doRotate(this.direction + 1)
  }

  onCollision (beam, puzzle, collision, currentStep, nextStep, collisionStep) {
    // TODO handle the case where a beam already occupies the portal
    if (!currentStep.state.portal) {
      // Handle entry collision
      return Beam.Step.from(nextStep, { state: { insertAbove: this.group.lastChild, portal: { entry: this } } })
    } else if (currentStep.state.portal.exit === this) {
      // Handle exit collision
      return Beam.Step.from(nextStep, { state: { insertAbove: this.group.lastChild } })
    }

    // Find all portals that match the opposite direction of this one (a.k.a the direction we are traveling).
    const destination = puzzle.getItems().filter((item) =>
      item.type === Item.Types.portal && item.direction === getOppositeDirection(this.direction))

    // If there is more than one matching destination, the user will need to pick
    if (destination.length > 1) {
      // TODO implement mask
      return collisionStep
    } else {
      return this.#step(destination[0], nextStep)
    }
  }

  #step (portal, nextStep) {
    return Beam.Step.from(nextStep, {
      tile: portal.parent,
      point: portal.parent.center,
      state: { disconnect: true, portal: { exit: portal } }
    })
  }
}
