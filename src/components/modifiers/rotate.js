import { Modifier } from '../modifier'
import { coalesce, MouseButton } from '../util'

export class Rotate extends Modifier {
  clockwise
  title = 'Items in this tile can be rotated.'

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
  direction

  rotatable
  rotation = 0
  rotationDegrees

  constructor (parent, state, configuration = {}) {
    super(...arguments)

    this.direction = coalesce(state.direction, configuration.direction)
    this.rotatable = coalesce(true, state.rotatable, configuration.rotatable)
    this.rotationDegrees = coalesce(60, state.rotationDegrees, configuration.rotationDegrees)
    this.rotation = coalesce(0, this.direction, state.rotation, configuration.rotation) % this.getMaxRotation()
  }

  // Get the direction of an item with rotation factored in
  getDirection () {
    return this.direction === undefined
      ? this.direction
      : Math.abs((this.direction + (this.rotation - this.direction)) % 6)
  }

  getMaxRotation () {
    return (360 / this.rotationDegrees)
  }

  onInitialization () {
    super.onInitialization()

    // Align the items with the configured direction on initialization
    this.rotateGroup(this.rotation)
  }

  rotateGroup (rotation) {
    if (this.rotatable) {
      this.group.rotate(rotation * this.rotationDegrees, this.center)
    }
  }

  rotate (clockwise) {
    const rotation = clockwise === false ? -1 : 1

    this.rotation = (rotation + this.rotation) % this.getMaxRotation()

    this.updateState((state) => { state.rotation = this.rotation })
    this.rotateGroup(rotation)
  }
}
