import { movable } from '../modifiers/move'
import { Item } from '../item'
import { Path, Point } from 'paper'
import { rotatable } from '../modifiers/rotate'
import { StepState } from '../step'
import { Puzzle } from '../puzzle'
import { coalesce, getOppositeDirection, merge } from '../util'
import { Schema } from '../schema'

export class Portal extends movable(rotatable(Item)) {
  #directions = {}

  constructor (tile, state) {
    state.type ??= Item.Types.Portal

    // Only allow rotation if direction is defined
    super(tile, state, { rotatable: state.direction !== undefined })

    this.direction = state.direction

    const height = state.height ? (state.height / 2) : (tile.parameters.circumradius / 3)
    const width = height * Portal.Ratio

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

    this.group.addChildren(children)

    if (this.direction !== undefined) {
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

    const exitPortals = this.#getExitPortals(puzzle, beam, nextStep)

    if (exitPortals.length === 0) {
      console.debug(this.toString(), 'no valid exit portals found')
      // This will cause the beam to stop
      return currentStep
    } else if (exitPortals.length === 1) {
      const exitPortal = exitPortals[0]
      console.debug(this.toString(), 'single exit portal matched:', exitPortal)
      return this.#getStep(beam, nextStep, exitPortal)
    } else {
      // Multiple matching destinations. User will need to pick one manually.
      console.debug(this.toString(), 'found multiple valid exit portals:', exitPortals)
      // Cache exit portals for use in mask
      const data = { exitPortals }
      const mask = new Puzzle.Mask(
        {
          id: this.id,
          onMask: () => currentStep.tile.beforeModify(),
          onTap: (puzzle, tile) => {
            const exitPortal = data.exitPortals.find((portal) => portal.parent === tile)
            if (exitPortal) {
              // Add a move, since the user made a decision
              puzzle.state.addMove('portal-exit', tile)
              beam.addStep(this.#getStep(beam, nextStep, exitPortal))
              puzzle.unmask()
            }
          },
          onUnmask: () => currentStep.tile.afterModify(),
          onUpdate: () => {
            // State may have changed, fetch portals again
            const exitPortals = this.#getExitPortals(puzzle, beam, nextStep)
            if (exitPortals.length === 0) {
              console.debug(this.toString(), 'mask onUpdate: no valid exit portals found')
              // Cancel the mask
              // This will also cause the beam to stop
              return false
            } else if (exitPortals.length === 1) {
              const exitPortal = exitPortals[0]
              console.debug(this.toString(), 'mask onUpdate: single portal matched:', exitPortal)
              beam.addStep(this.#getStep(beam, nextStep, exitPortal))
              // Cancel the mask
              return false
            } else {
              console.debug(this.toString(), 'mask onUpdate: exit portals:', exitPortals)
              data.exitPortals = exitPortals
            }
          },
          tileFilter: (tile) => {
            // Mask any invalid tiles. Exclude the entry portal tile
            return !(tile.equals(this.parent) ||
              data.exitPortals.map((portal) => portal.parent).some((validTile) => validTile.equals(tile)))
          }
        }
      )

      puzzle.updateSelectedTile(null)
      puzzle.mask(mask)

      // This will cause the beam to stop
      return currentStep
    }
  }

  onMove () {
    super.onMove()

    // Invalidate directions cache
    this.#directions = {}
  }

  update (direction, data) {
    this.#directions[direction] = data
  }

  #getExitPortals (puzzle, beam, nextStep) {
    const exitPortals = puzzle.layout.getItems().filter((item) =>
      // Is a portal
      item.type === Item.Types.Portal &&
      // But not the entry portal
      !item.equals(this) &&
      // There is no other beam occupying the portal at the exit direction
      !item.get(Portal.getExitDirection(nextStep, this, item)) && (
        // Entry portals without defined direction can exit from any other portal.
        this.getDirection() === undefined ||
        // Exit portals without defined direction can be used by any entry portal.
        item.getDirection() === undefined ||
        // Exit portals with a defined direction can only be used by entry portals with the same defined direction.
        item.getDirection() === this.getDirection()
      )
    )

    if (exitPortals.length > 1) {
      // Check for existing exitPortalId in beam state for this step
      const exitPortalId = beam.getState().steps?.[nextStep.index]?.[Item.Types.Portal]?.exitPortalId
      if (exitPortalId !== undefined) {
        console.debug(this.toString(), `found exitPortalId ${exitPortalId} in beam step ${nextStep.index} state`)
        const existing = exitPortals.find((item) => item.id === exitPortalId)
        if (existing) {
          return [existing]
        }
      }
    }

    return exitPortals
  }

  #getStep (beam, nextStep, exitPortal) {
    const direction = Portal.getExitDirection(nextStep, this, exitPortal)
    return nextStep.copy({
      connected: false,
      direction,
      insertAbove: exitPortal,
      onAdd: (step) => {
        exitPortal.update(direction, step)
        // Store this decision in beam state
        beam.updateState((state) => {
          state.steps ??= {}
          state.steps[step.index] ??= {}
          state.steps[step.index][Item.Types.Portal] = {
            entryPortalId: this.id,
            exitPortalId: exitPortal.id
          }
          return state
        })
      },
      onRemove: (step) => {
        // Remove any associated beam state
        beam.updateState((state) => { delete state.steps[step.index][Item.Types.Portal] })
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

  static schema = () => Object.freeze(merge([
    Item.schema(Item.Types.Portal),
    movable.schema(),
    rotatable.schema(),
    {
      properties: {
        direction: Schema.direction
      }
    }
  ]))

  static Ratio = 3 / 5
}
