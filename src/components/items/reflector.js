import { Path, Point, Size } from 'paper'
import { Item } from '../item'
import { rotatable } from '../modifiers/rotate'
import { getPointBetween, getOppositeDirection, getPosition, getReflectedDirection, getPointFrom } from '../util'
import { movable } from '../modifiers/move'
import { StepState } from '../step'

export class Reflector extends movable(rotatable(Item)) {
  #item

  constructor (tile, state) {
    super(tile, state, { rotationDegrees: 30 })

    this.color = state.color || 'black'
    this.#item = Reflector.item(tile, this.color)

    this.group.addChild(this.#item)
  }

  midLine () {
    // Two points which form a line through the mid-point of the reflector
    return [
      getPointBetween(this.#item.segments[3].point, this.#item.segments[0].point),
      getPointBetween(this.#item.segments[1].point, this.#item.segments[2].point)
    ]
  }

  getSide (point) {
    // Returns the side of the reflector the point is on (0, 1, or -1)
    return getPosition(this.midLine(), point)
  }

  isSameSide (pointA, pointB) {
    return this.getSide(pointA) === this.getSide(pointB)
  }

  onCollision ({ beam, collision, collisions, collisionStep, currentStep, nextStep }) {
    const directionFrom = getOppositeDirection(currentStep.direction)
    const directionTo = getReflectedDirection(directionFrom, this.rotation)

    if (directionTo === currentStep.direction) {
      console.debug(beam.toString(), 'stopping due to collision with non-reflective side of reflector')
      return collisionStep
    }

    if (directionTo === directionFrom) {
      console.debug(beam.toString(), 'stopping due to reflection back at self')
      if (collisions.some((collision) => collision.item.type === Item.Types.beam)) {
        // If there is also a beam collision in the list of collisions for this step, let that one resolve it
        return
      } else {
        // Instead of using collisionStep, just add a collision to nextStep. This will ensure any beams that hit the
        // same side of the reflector will collide with this beam.
        return nextStep.copy({
          done: true,
          state: nextStep.state.copy(new StepState.Collision(collision.copy({ points: [nextStep.point] })))
        })
      }
    }

    // The beam will collide with a reflector twice, on entry and exit, so ignore the first one, but track in state
    if (!currentStep.state.has(StepState.Reflector)) {
      return nextStep.copy({ state: nextStep.state.copy(new StepState.Reflector(this)) })
    }

    const point = getPointFrom(currentStep.point, nextStep.tile.parameters.inradius, directionTo)
    return nextStep.copy({ direction: directionTo, point })
  }

  static item (tile, color) {
    const length = tile.parameters.circumradius
    const width = tile.parameters.circumradius / 12
    const topLeft = tile.center.subtract(new Point(width / 2, length / 2))
    const size = new Size(width, length)

    return new Path.Rectangle({
      data: { size },
      fillColor: color,
      point: topLeft,
      size
    })
  }
}
