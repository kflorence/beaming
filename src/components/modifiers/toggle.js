import { Modifier } from '../modifier'
import { Icons } from '../icon.js'

export class Toggle extends Modifier {
  title = 'Toggle'
  toggled

  constructor (tile, state) {
    super(...arguments)

    // Need to do this on initialization so the modifier icon displayed in the tile will be accurate
    this.updateToggled()
  }

  attach (tile) {
    this.updateToggled()
    super.attach(tile)
  }

  getIcon () {
    return this.toggled ? Icons.ToggleOn : Icons.ToggleOff
  }

  onTap (event) {
    this.toggled = !this.toggled

    const items = this.tile.items.filter((item) => item.toggleable)
    if (!items.length) {
      return
    }

    items.forEach((item) => item.toggle(this.toggled))

    this.update()

    super.onTap(event, { items })
  }

  updateToggled () {
    this.toggled = this.parent?.items.some(item => item.toggled) ?? false
  }

  static schema = () => Object.freeze(Modifier.schema(Modifier.Types.Toggle))
}

/**
 * A mixin for Item which provides toggle behaviors.
 *
 * @param SuperClass
 * @returns {{new(*, *): ToggleableItem, toggled: *, prototype: ToggleableItem}}
 * @constructor
 */
export const toggleable = (SuperClass) => class ToggleableItem extends SuperClass {
  toggleable
  toggled

  constructor (parent, configuration) {
    super(...arguments)

    this.toggleable = !this.immutable && configuration.toggleable !== false
    this.toggled = (this.toggleable && configuration.toggled) ?? false
  }

  onToggle () {}

  toggle (toggled) {
    this.toggled = toggled
    this.onToggle()
  }
}

toggleable.schema = function schema () {
  return {
    properties: {
      toggleable: {
        default: true,
        type: 'boolean'
      },
      toggled: {
        type: 'boolean'
      }
    }
  }
}
