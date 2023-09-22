import { Modifier } from '../modifier'
import { Buttons } from '../util'

export class Rotate extends Modifier {
  clockwise = true
  name = Rotate.Names.right
  title = 'This item can be rotated.'

  constructor (item) {
    super(...arguments)

    if (typeof item.rotate !== 'function') {
      throw new Error('Item with Rotate modifier must mix-in RotatableItem.')
    }
  }

  onClick (event) {
    super.onClick(event)
    this.item.rotate(this.clockwise)
  }

  onMouseDown (event) {
    // Change rotation direction if user right-clicks on the modifier
    if (event.button === Buttons.Right) {
      this.clockwise = !this.clockwise
      this.update({ name: Rotate.Names[this.clockwise  ? 'right' : 'left'] })
    } else {
      super.onMouseDown(event)
    }
  }

  static Names = Object.freeze({ left: 'rotate_left', right: 'rotate_right ' })
  static Type = 'Rotate'
}

export const rotatable = (SuperClass) => class RotatableItem extends SuperClass {
  rotateDegrees = 30
  rotateDirection = 0

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
