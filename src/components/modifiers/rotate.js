import { Modifier } from '../modifier'
import { MouseButton } from '../util'
import { StateManager } from '../stateManager'

export class Rotate extends Modifier {
  clockwise

  title = 'Items in this tile can be rotated.'
  type = Modifier.Types.rotate

  constructor (tile, configuration) {
    super(...arguments)

    this.clockwise = configuration.clockwise !== false
    this.name = Rotate.Names[this.clockwise ? 'right' : 'left']
  }

  onClick (event) {
    super.onClick(event)

    const items = this.tile.items.filter((item) => item.rotatable)
    items.forEach((item) => item.rotate(this.clockwise))

    const move = items.map((item) => new StateManager.Update(
      StateManager.Update.Types.set,
      item.getObjectPath().concat([Rotate.Paths.direction]),
      item.direction
    ))

    this.dispatchEvent(Modifier.Events.Invoked, { items, move })
  }

  onMouseDown (event) {
    // Change rotation direction if user right-clicks on the modifier
    if (event.button === MouseButton.Right) {
      this.clockwise = !this.clockwise
      this.update({ name: Rotate.Names[this.clockwise ? 'right' : 'left'] })
    } else {
      super.onMouseDown(event)
    }
  }

  static Names = Object.freeze({ left: 'rotate_left', right: 'rotate_right ' })
  static Paths = Object.freeze({ direction: 'direction' })
}

/**
 * A mixin for Item which provides rotate behaviors.
 *
 * @param SuperClass
 * @returns {{new(*, *): RotatableItem, rotatable: boolean, direction: number, prototype: RotatableItem}}
 */
export const rotatable = (SuperClass) => class RotatableItem extends SuperClass {
  constructor (parent, configuration) {
    super(...arguments)

    this.direction = configuration.direction || 0
    this.rotatable = configuration.rotatable !== false
    this.rotateDegrees = configuration.rotateDegrees || 60

    if (this.rotatable) {
      this.doRotate(this.direction)
    }
  }

  doRotate (direction) {
    this.group.rotate(direction * this.rotateDegrees, this.center)
  }

  rotate (clockwise) {
    const direction = clockwise === false ? -1 : 1
    const directionMax = (360 / this.rotateDegrees)

    this.direction = (this.direction + direction) % directionMax

    this.doRotate(direction)
  }
}
