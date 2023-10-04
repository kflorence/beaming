import { Modifier } from '../modifier'
import { Buttons } from '../util'

export class Rotate extends Modifier {
  clockwise = true
  name = Rotate.Names.right
  title = 'Items in this tile can be rotated.'
  type = Modifier.Types.rotate

  constructor () {
    super(...arguments)

    this.items = this.tile.items.filter((item) => item.rotatable === true)
  }

  onClick (event) {
    super.onClick(event)

    const items = this.items.filter((item) => item.rotatable)
    items.forEach((item) => item.rotate(this.clockwise))

    this.dispatchEvent(Modifier.Events.Invoked, { items })
  }

  onMouseDown (event) {
    // Change rotation direction if user right-clicks on the modifier
    if (event.button === Buttons.Right) {
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

    // The reflector rotates like the hands on a clock. Zero and twelve are equal.
    if (direction < 0 && this.rotateDirection === 0) {
      this.rotateDirection = 11
    } else if (direction > 0 && this.rotateDirection === 12) {
      this.rotateDirection = 1
    } else {
      this.rotateDirection += direction
    }

    this.doRotate(direction)
  }
}
