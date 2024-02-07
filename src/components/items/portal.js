import { movable } from '../modifiers/move'
import { Item } from '../item'
import { Path, Point } from 'paper'
import { rotatable } from '../modifiers/rotate'
import { StepState } from '../step'
import { Puzzle } from '../puzzle'
import { getOppositeDirection } from '../util'

export class Portal extends movable(rotatable(Item)) {
  #directions = {}

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

    // TODO: consider adding an item with a gradient that fades to black at the center of the ellipse
    // This will help distinguish visually that beams are entering/exiting a portal when there are multiple
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

  get (direction) {
    return this.#directions[direction]
  }

  onCollision ({ beam, currentStep, nextStep, puzzle }) {
    const portalState = currentStep.state.get(StepState.Portal)
    if (!portalState) {
      const entryDirection = getOppositeDirection(nextStep.direction)
      if (this.get(entryDirection)) {
        // Trying to enter through a direction that is already occupied.
        // Let beam.onCollision handle it.
        return
      }

      // Handle entry collision
      return nextStep.copy({
        insertAbove: this,
        onAdd: () => this.update(entryDirection, beam),
        onRemove: () => this.update(entryDirection),
        state: nextStep.state.copy(new StepState.Portal(this))
      })
    } else if (portalState.exitPortal === this) {
      // Handle exit collision
      return nextStep.copy({ insertAbove: this })
    }

    // Check for destination in beam state (matches on item ID and step index)
    const stateId = [this.id, nextStep.index].join(':')
    const destinationId = beam.getState().moves?.[stateId]

    // Find all valid destination portals
    const destinations = puzzle.getItems().filter((item) =>
      item.type === Item.Types.portal &&
      !item.equals(this) &&
      // Portal must not already have a beam occupying the desired direction
      !item.get(Portal.getExitDirection(nextStep, portalState.entryPortal, item)) &&
      (destinationId === undefined || item.id === destinationId) &&
      (
        // Entry portals without defined direction can exit from any other portal.
        this.getDirection() === undefined ||
        // Exit portals without defined direction can be used by any entry portal.
        item.getDirection() === undefined ||
        // Exit portals with a defined direction can only be used by entry portals with the same defined direction.
        item.getDirection() === this.getDirection()
      )
    )

    if (destinations.length === 0) {
      console.debug(this.toString(), 'no valid destinations found')
      // This will cause the beam to stop
      return currentStep
    }

    if (destinations.length === 1) {
      // A single matching destination
      return this.#getStep(beam, destinations[0], nextStep, portalState)
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
              beam.addStep(this.#getStep(beam, destination, nextStep, portalState))
              beam.updateState((state) => {
                if (!state.moves) {
                  state.moves = {}
                }
                // Store this decision in beam state
                state.moves[stateId] = destination.id
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

      // This will cause the beam to stop
      return currentStep
    }
  }

  update (direction, beam) {
    this.#directions[direction] = beam
  }

  #getStep (beam, portal, nextStep, portalState) {
    const direction = Portal.getExitDirection(nextStep, portalState.entryPortal, portal)
    return nextStep.copy({
      connected: false,
      direction,
      insertAbove: portal,
      onAdd: () => portal.update(direction, beam),
      onRemove: () => portal.update(direction),
      point: portal.parent.center,
      state: nextStep.state.copy(new StepState.Portal(portalState.entryPortal, portal)),
      tile: portal.parent
    })
  }

  static getExitDirection (step, entryPortal, exitPortal) {
    // Direction precedence is as follows:
    // - direction defined by exit portal
    // - direction defined by entry portal
    // - direction beam was traveling when it reached the entry portal
    return exitPortal.getDirection() ?? entryPortal.getDirection() ?? step.direction
  }
}
