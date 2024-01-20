import { Path, Point, Size } from 'paper'
import { Item } from '../item'
import { rotatable } from '../modifiers/rotate'
import { getMidPoint, getOppositeDirection, getPosition, getReflectedDirection } from '../util'
import { Beam } from './beam'
import { movable } from '../modifiers/move'
import { StepState } from '../step'
import { Collision } from '../collision'

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
      getMidPoint(this.#item.segments[3].point, this.#item.segments[0].point),
      getMidPoint(this.#item.segments[1].point, this.#item.segments[2].point)
    ]
  }

  getSide (point) {
    // Returns the side of the reflector the point is on (0, 1, or -1)
    return getPosition(this.midLine(), point)
  }

  isSameSide (pointA, pointB) {
    return this.getSide(pointA) === this.getSide(pointB)
  }

  onCollision ({ beam, collisions, collisionStep, currentStep, nextStep }) {
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
        const collision = collisionStep.state.get(StepState.Collision)
        // Updating the collision stored on collisionStep to use nextStep.point to ensure any beams hitting the same
        // reflector will be collided with
        return collisionStep.copy({
          point: nextStep.point,
          state: collisionStep.state.copy(new StepState.Collision(new Collision(
            collision.index,
            [nextStep.point],
            collision.items
          )))
        })
      }
    }

    // The beam will collide with a reflector twice, on entry and exit, so ignore the first one, but track in state
    if (!currentStep.state.has(StepState.Reflector)) {
      return nextStep.copy({ state: nextStep.state.copy(new StepState.Reflector(this)) })
    }

    const point = Beam.getNextPoint(currentStep.point, nextStep.tile.parameters.inradius, directionTo)
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
