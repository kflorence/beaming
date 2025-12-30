import { Modifier } from '../modifier'
import { addDirection, coalesce, merge } from '../util'
import { Icons } from '../icon.js'

export class Rotate extends Modifier {
  clockwise
  title = 'Rotate'

  constructor (tile, state, configuration = {}) {
    super(...arguments)

    this.clockwise = coalesce(true, state.clockwise, configuration.clockwise)
  }

  attach (tile) {
    super.attach(tile)
    if (!this.disabled) {
      this.update({ disabled: !tile?.items.some(Rotate.rotatable) })
    }
  }

  getIcon () {
    return this.clockwise ? Icons.RotateRight : Icons.RotateLeft
  }

  onTap (event) {
    const items = this.tile.items.filter(Rotate.rotatable)
    if (!items.length) {
      return
    }

    items.forEach((item) => item.rotate(this.clockwise))

    super.onTap(event, { items })
  }

  onToggle () {
    super.onToggle()

    this.clockwise = !this.clockwise
    this.updateState((state) => { state.clockwise = this.clockwise })
    this.update()

    this.dispatchEvent(Modifier.Events.Toggled, { clockwise: this.clockwise })
  }

  static rotatable (item) {
    return item.rotatable
  }

  static schema = () => Object.freeze(merge(Modifier.schema(Modifier.Types.Rotate), {
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

  static schema () {
    return {
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
  }
}
