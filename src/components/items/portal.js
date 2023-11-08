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

    if (this.hasDirection()) {
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
    if (this.hasDirection()) {
      this.doRotate(this.direction + 1)
    }
  }

  hasDirection () {
    return this.direction !== undefined
  }

  onCollision (beam, puzzle, collision, collisionIndex, collisions, currentStep, nextStep, collisionStep) {
    const hasDirection = this.hasDirection()
    const index = this.getIndex() + 1

    if (!currentStep.state.portal) {
      if (hasDirection) {
        // Check for an existing beam exiting the portal
        const beamCollisionIndex = collisions.findIndex((collision) =>
          collision.item.type === Item.Types.beam &&
            collision.item.getSteps(nextStep.tile).some((step) => step.state.portal?.exit === this))

        if (beamCollisionIndex >= 0) {
          console.debug(this.id, 'beam attempting to enter portal exit')
          const beamCollision = collisions[beamCollisionIndex]
          return beamCollision.item.onCollision(
            beam,
            puzzle,
            beamCollision,
            beamCollisionIndex,
            collisions,
            currentStep,
            nextStep,
            Beam.Step.from(collisionStep, {
              point: nextStep.point,
              state: Object.assign(Beam.getCollisionState(beamCollision), { index })
            })
          )
        }
      }

      // Handle entry collision
      return Beam.Step.from(nextStep, { state: { index, portal: { entry: this } } })
    } else if (currentStep.state.portal.exit === this) {
      // Handle exit collision
      return Beam.Step.from(nextStep, { state: { index } })
    }

    const matchingDirection = hasDirection ? getOppositeDirection(this.direction) : this.direction

    // Find all portals that match the opposite direction of this one (a.k.a the direction we are traveling).
    const destinations = puzzle.getItems()
      .filter((item) => item.type === Item.Types.portal && !item.equals(this) && item.direction === matchingDirection)

    if (destinations.length === 0) {
      // No matching destinations
      return collisionStep
    } else if (destinations.length === 1) {
      // A single matching destination
      return this.#step(destinations[0], nextStep)
    } else {
      // If there is more than one matching destination, the user will need to pick one
      console.log(destinations)
      // TODO implement mask
      return collisionStep
    }
  }

  #step (portal, nextStep) {
    return Beam.Step.from(nextStep, {
      direction: this.hasDirection() ? this.direction : nextStep.direction,
      tile: portal.parent,
      point: portal.parent.center,
      state: { disconnect: true, portal: { exit: portal } }
    })
  }
}
