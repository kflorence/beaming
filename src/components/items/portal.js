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

    this.direction = configuration.direction

    const height = tile.parameters.circumradius / 3
    const width = tile.parameters.circumradius / 5

    const style = {
      fillColor: 'black',
      strokeColor: 'white',
      strokeWidth: 2
    }

    const children = []

    const ellipse = new Path.Ellipse({
      center: tile.center,
      radius: [width, height],
      style
    })

    children.push(ellipse)

    const ring = new Path.Ellipse({
      center: tile.center,
      radius: [width - style.strokeWidth * 2, height - style.strokeWidth * 2],
      style
    })

    children.push(ring)

    if (this.direction !== undefined) {
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

      children.unshift(pointer)
    }

    this.group = new Group({
      children,
      data: { id: this.id, type: this.type },
      locked: true
    })

    // Align with the hexagonal directions (0 = 5)
    if (this.direction !== undefined) {
      this.doRotate(this.direction + 1)
    }
  }

  onCollision (beam, puzzle, collision, currentStep, nextStep, collisionStep) {
    const index = this.getIndex() + 1

    // TODO handle the case where a beam already occupies the portal
    if (!currentStep.state.portal) {
      // Handle entry collision
      return Beam.Step.from(nextStep, { state: { index, portal: { entry: this } } })
    } else if (currentStep.state.portal.exit === this) {
      // Handle exit collision
      return Beam.Step.from(nextStep, { state: { index } })
    }

    const matchingDirection = this.direction === undefined ? this.direction : getOppositeDirection(this.direction)

    // Find all portals that match the opposite direction of this one (a.k.a the direction we are traveling).
    const destination = puzzle.getItems()
      .filter((item) => item.type === Item.Types.portal && item.direction === matchingDirection && item !== this)

    // If there is more than one matching destination, the user will need to pick
    if (destination.length > 1) {
      console.log(destination)
      // TODO implement mask
      return collisionStep
    } else {
      return this.#step(destination[0], nextStep)
    }
  }

  #step (portal, nextStep) {
    return Beam.Step.from(nextStep, {
      direction: this.direction === undefined ? nextStep.direction : this.direction,
      tile: portal.parent,
      point: portal.parent.center,
      state: { disconnect: true, portal: { exit: portal } }
    })
  }
}
