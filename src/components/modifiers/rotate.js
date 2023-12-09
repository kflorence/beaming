import { Modifier } from '../modifier'
import { coalesce, MouseButton } from '../util'

export class Rotate extends Modifier {
  clockwise

  title = 'Items in this tile can be rotated.'
  type = Modifier.Types.rotate

  constructor (tile, state, configuration = {}) {
    super(...arguments)

    this.clockwise = coalesce(true, state.clockwise, configuration.clockwise)
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
      this.updateState((state) => { state.clockwise = this.clockwise })
      this.update({ name: Rotate.Names[this.clockwise ? 'right' : 'left'] })
    } else {
      super.onMouseDown(event)
    }
  }

  static Names = Object.freeze({ left: 'rotate_left', right: 'rotate_right ' })
}

/**
 * A mixin for Item which provides rotate behaviors.
 */
export const rotatable = (SuperClass) => class RotatableItem extends SuperClass {
  constructor (parent, state, configuration = {}) {
    super(...arguments)

    this.direction = coalesce(0, state.direction, configuration.direction)
    this.rotatable = coalesce(true, state.rotatable, configuration.rotatable)
    this.rotateDegrees = coalesce(60, state.rotateDegrees, configuration.rotateDegrees)

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

    // noinspection JSValidateTypes
    this.direction = (direction + this.direction) % directionMax
    this.updateState((state) => { state.direction = this.direction })

    this.doRotate(direction)
  }
}
