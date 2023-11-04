import { Modifier } from '../modifier'
import { MouseButton } from '../util'

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

    this.dispatchEvent(Modifier.Events.Invoked, { items })
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
}

/**
 * A mixin for Item which provides rotate behaviors.
 *
 * @param SuperClass
 * @returns {{new(*, *): RotatableItem, rotatable: boolean, rotateDirection: number, prototype: RotatableItem}}
 */
export const rotatable = (SuperClass) => class RotatableItem extends SuperClass {
  rotatable

  // Generally 30 (12 rotations) or 60 (6 rotations)
  rotateDegrees = 30
  rotateDirection = 0

  constructor (parent, configuration) {
    super(...arguments)

    this.rotatable = configuration.rotatable !== false
  }

  doRotate (direction) {
    this.group.rotate(direction * this.rotateDegrees, this.center)
  }

  rotate (clockwise) {
    const direction = clockwise === false ? -1 : 1
    const directionMax = (360 / this.rotateDegrees)

    this.rotateDirection = (this.rotateDirection + direction) % directionMax

    this.doRotate(direction)
  }
}
