import { Group, Path, Point, Size } from 'paper'
import { Item } from '../item'
import { rotatable } from '../modifiers/rotate'
import { getOppositeDirection, getReflectedDirection } from '../util'
import { Beam } from './beam'
import { movable } from '../modifiers/move'

export class Reflector extends movable(rotatable(Item)) {
  type = Item.Types.reflector

  #ui

  constructor (tile, configuration) {
    super(...arguments)

    this.#ui = Reflector.ui(tile, configuration)

    this.color = this.#ui.item.fillColor
    this.group = this.#ui.group
    this.rotateDirection = configuration.direction || 0

    this.doRotate(this.rotateDirection)
  }

  onCollision (beam, puzzle, collision, currentStep, nextStep, collisionStep) {
    const directionFrom = getOppositeDirection(currentStep.direction)
    const directionTo = getReflectedDirection(directionFrom, this.rotateDirection)

    if (directionTo === currentStep.direction) {
      console.debug(beam.color, 'stopping due to collision with non-reflective side of reflector')
      return collisionStep
    }

    if (directionTo === directionFrom) {
      console.debug(beam.color, 'stopping due to reflection back at self')
      return collisionStep
    }

    // The beam will collide with a reflector twice, on entry and exit, so ignore the first one, but track in state
    if (!currentStep.state.reflected) {
      return Beam.Step.from(nextStep, { state: { reflected: true } })
    }

    const point = Beam.getNextPoint(currentStep.point, nextStep.tile.parameters.inradius, directionTo)
    return Beam.Step.from(nextStep, { direction: directionTo, point })
  }

  static ui (tile, { color }) {
    const length = tile.parameters.circumradius
    const width = tile.parameters.circumradius / 12
    const topLeft = tile.center.subtract(new Point(width / 2, length / 2))

    const item = new Path.Rectangle({
      fillColor: color || 'black',
      point: topLeft,
      size: new Size(width, length)
    })

    const group = new Group({
      children: [item],
      locked: true
    })

    return { item, group }
  }
}
