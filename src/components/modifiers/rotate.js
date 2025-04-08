import { Modifier } from '../modifier'
import { addDirection, coalesce, merge } from '../util'
import { Icons } from '../icons'

export class Rotate extends Modifier {
  clockwise
  title = 'Rotate'

  constructor (tile, state, configuration = {}) {
    super(...arguments)

    this.clockwise = coalesce(true, state.clockwise, configuration.clockwise)
    this.name = Rotate.Names[this.clockwise ? 'right' : 'left']
  }

  moveFilter (tile) {
    // Filter out tiles that contain no rotatable items
    return super.moveFilter(tile) || !tile.items.some((item) => item.rotatable)
  }

  onTap (event) {
    super.onTap(event)

    const items = this.tile.items.filter((item) => item.rotatable)
    items.forEach((item) => item.rotate(this.clockwise))

    this.dispatchEvent(Modifier.Events.Invoked, { items })
  }

  onToggle () {
    super.onToggle()

    this.clockwise = !this.clockwise
    this.updateState((state) => { state.clockwise = this.clockwise })
    this.update({ name: Rotate.Names[this.clockwise ? 'right' : 'left'] })

    this.dispatchEvent(Modifier.Events.Toggled, { clockwise: this.clockwise })
  }

  static Names = Object.freeze({ left: Icons.RotateLeft.name, right: Icons.RotateRight.name })

  static Schema = Object.freeze(merge(Modifier.schema(Modifier.Types.rotate), {
    properties: {
      clockwise: {
        type: 'boolean'
      }
    }
  }))
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
    this.rotatable = !this.immutable && coalesce(true, state.rotatable, configuration.rotatable)
    this.rotationDegrees = coalesce(60, state.rotationDegrees, configuration.rotationDegrees)
    this.rotation = coalesce(0, state.rotation, configuration.rotation) % this.getMaxRotation()
  }

  // Get the direction of an item with rotation factored in
  getDirection (direction) {
    direction = direction ?? this.direction
    return direction === undefined
      ? direction
      : addDirection(direction, this.rotation)
  }

  getMaxRotation () {
    return (360 / this.rotationDegrees)
  }

  onInitialization () {
    super.onInitialization()

    this.rotateGroup(this.rotation)

    if (this.direction !== undefined) {
      // Direction will not affect initial rotation of item
      this.rotateGroup(this.direction)
    }
  }

  rotateGroup (rotation) {
    this.group.rotate(rotation * this.rotationDegrees, this.center)
  }

  rotate (clockwise) {
    if (!this.rotatable) {
      return
    }

    const rotation = clockwise === false ? -1 : 1

    this.rotation = (rotation + this.rotation) % this.getMaxRotation()

    this.updateState((state) => { state.rotation = this.rotation })
    this.rotateGroup(rotation)
  }
}

rotatable.Schema = {
  properties: {
    direction: {
      type: 'number'
    },
    rotatable: {
      default: true,
      type: 'boolean'
    },
    rotation: {
      type: 'number'
    },
    rotationDegrees: {
      enum: [30, 60, 90],
      type: 'number'
    }
  }
}
