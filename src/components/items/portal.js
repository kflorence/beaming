import { movable } from '../modifiers/move'
import { Item } from '../item'
import { Path, Point } from 'paper'
import { rotatable } from '../modifiers/rotate'
import { Step, StepState } from '../step'
import { Puzzle } from '../puzzle'

export class Portal extends movable(rotatable(Item)) {
  constructor (tile, state) {
    // Only allow rotation if direction is defined
    super(tile, state, { rotatable: state.direction !== undefined })

    this.direction = state.direction

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
      // Properly align items with hexagonal rotation
      this.rotateGroup(1)
    }
  }

  onCollision ({ beam, collision, currentStep, nextStep, puzzle }) {
    const direction = this.getDirection()
    const portalState = currentStep.state.get(StepState.Portal)
    if (!portalState) {
      // Handle entry collision
      return nextStep.copy({
        // Use the direction indicated by the entry portal if it exists, otherwise continue in the same direction.
        direction: direction ?? nextStep.direction,
        insertAbove: this,
        state: nextStep.state.copy(new StepState.Portal(this))
      })
    } else if (portalState.exitPortal === this) {
      // Handle exit collision
      return nextStep.copy({ insertAbove: this })
    }

    // Check for destination in beam state (matches on item ID and step index)
    const stateId = [this.id, nextStep.index].join(':')
    const destinationId = beam.getState().collisions?.[stateId]

    // Find all valid destination portals
    const destinations = puzzle.getItems().filter((item) =>
      item.type === Item.Types.portal &&
      !item.equals(this) &&
      (destinationId === undefined || item.id === destinationId) &&
      (
        // Entry portals without defined direction can exit from any other portal.
        direction === undefined ||
        // Exit portals without defined direction can be used by any entry portal.
        item.getDirection() === undefined ||
        // Exit portals with a defined direction can only be used by entry portals with the same defined direction.
        item.getDirection() === direction
      )
    )

    if (destinations.length === 0) {
      console.debug(this.toString(), 'no valid destinations found')
      // Update current step with collision.
      return currentStep.copy({
        state: currentStep.state.copy(new StepState.Collision(collision.copy({ points: [currentStep.point] })))
      })
    }

    if (destinations.length === 1) {
      // A single matching destination
      return this.#step(destinations[0], nextStep, portalState)
    } else {
      // Multiple matching destinations. User will need to pick one manually.
      const destinationTiles = destinations.map((portal) => portal.parent)
      const mask = new Puzzle.Mask(
        {
          beam,
          id: stateId,
          onMask: () => currentStep.tile.beforeModify(),
          onTap: (puzzle, tile) => {
            const destination = destinations.find((portal) => portal.parent === tile)
            if (destination) {
              beam.addStep(this.#step(destination, nextStep, portalState))
              beam.updateState((state) => {
                if (!state.collisions) {
                  state.collisions = {}
                }
                // Store this decision in beam state
                state.collisions[stateId] = destination.id
              })
              puzzle.unmask()
            }
          },
          onUnmask: () => currentStep.tile.afterModify(),
          tileFilter: (tile) => {
            // Include the portal tile and tiles which contain a matching destination
            return !(this.parent === tile || destinationTiles.some((destinationTile) => destinationTile === tile))
          }
        }
      )

      puzzle.mask(mask)

      return new Step.Stop()
    }
  }

  #step (portal, nextStep, portalState) {
    return nextStep.copy({
      connected: false,
      // Use the direction indicated by the exit portal if it exists, otherwise continue in the same direction.
      direction: portal.getDirection() ?? nextStep.direction,
      insertAbove: portal,
      point: portal.parent.center,
      state: nextStep.state.copy(new StepState.Portal(portalState.entryPortal, portal)),
      tile: portal.parent
    })
  }
}
