import { movable } from '../modifiers/move'
import { Item } from '../item'
import { Path, Point } from 'paper'
import { rotatable } from '../modifiers/rotate'
import { StepState } from '../step'
import { Puzzle } from '../puzzle'
import { coalesce, getOppositeDirection } from '../util'

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
      const existing = coalesce(this.get(entryDirection), nextStep)
      if (existing.index < nextStep.index) {
        // Checking stepIndex to exclude cases where we are doing a re-evaluation of history.
        console.debug(
          this.toString(),
          'ignoring beam trying to enter through a direction which is already occupied:',
          entryDirection
        )
        return
      }

      // Handle entry collision
      return nextStep.copy({
        insertAbove: this,
        onAdd: (step) => this.update(entryDirection, step),
        onRemove: () => this.update(entryDirection),
        state: nextStep.state.copy(new StepState.Portal(this))
      })
    } else if (portalState.exitPortal === this) {
      // Handle exit collision
      return nextStep.copy({ insertAbove: this })
    }

    // Find all valid exit portals
    const validExitPortals = puzzle.getItems().filter((item) =>
      item.type === Item.Types.portal && !item.equals(this) && (
        // Entry portals without defined direction can exit from any other portal.
        this.getDirection() === undefined ||
        // Exit portals without defined direction can be used by any entry portal.
        item.getDirection() === undefined ||
        // Exit portals with a defined direction can only be used by entry portals with the same defined direction.
        item.getDirection() === this.getDirection()
      ) &&
      // Don't allow the user to select an exit portal that already has a beam entering at the same direction.
      // FIXME: this is currently allowing a beam to merge into itself infinite times.
      // Maybe just simplify portals to now allow merging of beams, and move that functionality into a separate item.
      !item.get(Portal.getExitDirection(nextStep, this, item))?.state.get(StepState.Portal)?.entryPortal?.equals(item)
    )

    if (validExitPortals.length === 0) {
      console.debug(this.toString(), 'no valid exit portals found')
      // This will cause the beam to stop
      return currentStep
    }

    // Check for existing exitPortalId in beam state for this step
    const exitPortalId = beam.getState().steps?.[nextStep.index]?.portal?.[this.id]
    if (exitPortalId !== undefined) {
      console.debug(this.toString(), `matching on exitPortalId from beam step state: ${exitPortalId}`)
    }

    const exitPortal = validExitPortals.length === 1
      ? validExitPortals[0]
      : validExitPortals.find((item) => item.id === exitPortalId)

    console.log(validExitPortals)
    if (exitPortal) {
      // A single matching destination
      return this.#getStep(beam, nextStep, exitPortal)
    } else {
      // Multiple matching destinations. User will need to pick one manually.
      const destinationTiles = validExitPortals.map((portal) => portal.parent)
      const mask = new Puzzle.Mask(
        {
          beam,
          id: this.id,
          onMask: () => currentStep.tile.beforeModify(),
          onTap: (puzzle, tile) => {
            const exitPortal = validExitPortals.find((portal) => portal.parent === tile)
            if (exitPortal) {
              beam.addStep(this.#getStep(beam, nextStep, exitPortal))
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

      puzzle.updateSelectedTile(null)
      puzzle.mask(mask)

      // This will cause the beam to stop
      return currentStep
    }
  }

  update (direction, data) {
    this.#directions[direction] = data
  }

  #getStep (beam, nextStep, exitPortal) {
    const direction = Portal.getExitDirection(nextStep, this, exitPortal)
    return nextStep.copy({
      connected: false,
      direction,
      insertAbove: exitPortal,
      onAdd: (step) => {
        exitPortal.update(direction, step)
        // Store this decision in beam state and generate a matching delta
        beam.updateState((state) => (((state.steps ??= {})[step.index] ??= {}).portal = { [this.id]: exitPortal.id }))
      },
      onRemove: (step) => {
        // Remove any associated beam state, but don't generate a delta.
        // If the step is being removed, a delta for that action was most likely created elsewhere already.
        beam.updateState((state) => { delete state.steps[step.index].portal }, false)
        exitPortal.update(direction)
      },
      point: exitPortal.parent.center,
      state: nextStep.state.copy(new StepState.Portal(this, exitPortal)),
      tile: exitPortal.parent
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
