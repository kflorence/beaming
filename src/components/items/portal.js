import { movable } from '../modifiers/move'
import { Item } from '../item'
import { Path, Point } from 'paper'
import { rotatable } from '../modifiers/rotate'
import { getOppositeDirection } from '../util'
import { Beam } from './beam'
import { Puzzle } from '../puzzle'

export class Portal extends movable(rotatable(Item)) {
  constructor (tile, configuration, layout) {
    // Only allow rotation if direction is defined
    configuration.rotatable = configuration.direction !== undefined

    super(...arguments)

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

    if (this.rotatable) {
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

    this.group.addChildren(children)

    if (this.rotatable) {
      // Properly align the item visually with the hexagonal directions.
      // As drawn, it is off by one rotation (e.g. 0 = 5).
      this.doRotate(1)
    }
  }

  onCollision (
    beam,
    puzzle,
    collision,
    collisionIndex,
    collisions,
    currentStep,
    nextStep,
    existingNextStep,
    collisionStep
  ) {
    const matchingDirection = this.rotatable ? getOppositeDirection(this.direction) : this.direction

    // Find all portals that match the opposite direction of this one (a.k.a the direction we are traveling).
    const destinations = puzzle.getItems().filter((item) =>
      item.type === Item.Types.portal && !item.equals(this) && item.direction === matchingDirection)

    if (destinations.length === 0) {
      console.debug('portal has no destinations, stopping')
      // Nowhere to go
      return collisionStep
    }

    if (!currentStep.state.portal) {
      const state = { insertAbove: this, portal: { entry: this } }

      // Handle entry collision
      return Beam.Step.from(nextStep, { state })
    } else if (currentStep.state.portal.exit === this) {
      // Handle exit collision
      return Beam.Step.from(nextStep, { state: { insertAbove: this } })
    }

    if (destinations.length === 1) {
      // A single matching destination
      return this.#step(destinations[0], nextStep)
    } else {
      const destinationTiles = destinations.map((portal) => portal.parent)

      currentStep.tile.beforeModify()

      // Multiple matching destinations. User will need to pick one manually.
      puzzle.mask(new Puzzle.Mask(
        (tile) => {
          // Include the portal tile and tiles which contain a matching destination
          return !(this.parent === tile || destinationTiles.some((destinationTile) => destinationTile === tile))
        },
        (puzzle, tile) => {
          const destination = destinations.find((portal) => portal.parent === tile)
          if (destination) {
            currentStep.tile.afterModify()
            beam.addStep(this.#step(destination, nextStep))
            puzzle.unmask()
            puzzle.update()
          }
        }
      ))

      return Beam.Stop
    }
  }

  #step (portal, nextStep) {
    return Beam.Step.from(nextStep, {
      direction: this.rotatable ? this.direction : nextStep.direction,
      tile: portal.parent,
      point: portal.parent.center,
      state: { disconnect: true, insertAbove: portal, portal: { exit: portal } }
    })
  }
}
