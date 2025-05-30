import { Modifier } from '../modifier'
import { Icons } from '../icons'

export class Toggle extends Modifier {
  title = 'Toggle'
  toggled

  constructor (tile, state) {
    super(...arguments)

    this.toggled = this.parent?.items.some(item => item.toggled) ?? false
    this.name = this.getName()
  }

  attach (tile) {
    super.attach(tile)

    this.toggled = tile?.items.some(item => item.toggled) ?? false
    this.update({ name: this.getName() })
  }

  getName () {
    return Toggle.Names[this.toggled ? 'on' : 'off']
  }

  moveFilter (tile) {
    // Filter out tiles that contain no toggleable items
    return super.moveFilter(tile) || !tile.items.some(item => item.toggleable)
  }

  onTap (event) {
    super.onTap(event)

    this.toggled = !this.toggled

    const items = this.tile.items.filter((item) => item.toggleable)
    if (!items.length) {
      return
    }

    items.forEach((item) => item.toggle(this.toggled))

    this.update({ name: this.getName() })

    this.dispatchEvent(Modifier.Events.Invoked, { items })
  }

  static Names = Object.freeze({ on: Icons.ToggleOn.name, off: Icons.ToggleOff.name })

  static Schema = Object.freeze(Modifier.schema(Modifier.Types.toggle))
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

toggleable.Schema = {
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
