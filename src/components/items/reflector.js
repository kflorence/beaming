import { Path, Point, Size } from 'paper'
import { Item } from '../item'
import { rotatable } from '../modifiers/rotate'
import { getOppositeDirection, getReflectedDirection } from '../util'
import { Beam } from './beam'
import { movable } from '../modifiers/move'
import { StepState } from '../step'

export class Reflector extends movable(rotatable(Item)) {
  constructor (tile, state) {
    super(tile, state, { rotationDegrees: 30 })

    this.color = state.color || 'black'
    this.group.addChild(Reflector.item(tile, this.color))
  }

  onCollision (
    beam, puzzle, collision, collisionIndex, collisions, currentStep, nextStep, existingNextStep, collisionStep) {
    const directionFrom = getOppositeDirection(currentStep.direction)
    const directionTo = getReflectedDirection(directionFrom, this.rotation)

    if (directionTo === currentStep.direction) {
      console.debug(beam.color, 'stopping due to collision with non-reflective side of reflector')
      return collisionStep
    }

    if (directionTo === directionFrom) {
      console.debug(beam.color, 'stopping due to reflection back at self')
      return collisionStep
    }

    // The beam will collide with a reflector twice, on entry and exit, so ignore the first one, but track in state
    if (!currentStep.state.has(StepState.Reflector)) {
      return nextStep.copy({ state: nextStep.state.copy(new StepState.Reflector()) })
    }

    const point = Beam.getNextPoint(currentStep.point, nextStep.tile.parameters.inradius, directionTo)
    return nextStep.copy({ direction: directionTo, point })
  }

  static item (tile, color) {
    const length = tile.parameters.circumradius
    const width = tile.parameters.circumradius / 12
    const topLeft = tile.center.subtract(new Point(width / 2, length / 2))

    return new Path.Rectangle({
      fillColor: color,
      point: topLeft,
      size: new Size(width, length)
    })
  }
}
