import { Modifier } from '../modifier'
import { Icons } from '../icons'

export class Toggle extends Modifier {
  on
  title = 'Toggle'

  constructor (tile, { on }) {
    super(...arguments)

    this.on = on || false
    this.name = Toggle.Names[this.on ? 'on' : 'off']

    this.tile.items.forEach((item) => {
      item.toggled = this.on
    })
  }

  attach () {
    super.attach()
  }

  moveFilter (tile) {
    // Filter out tiles that contain no toggleable items
    return super.moveFilter(tile) || !tile.items.some((item) => item.toggleable)
  }

  onTap (event) {
    super.onTap(event)

    this.on = !this.on

    const items = this.tile.items.filter((item) => item.toggleable)
    items.forEach((item) => item.toggle(this.on))

    this.update({ name: Toggle.Names[this.on ? 'on' : 'off'] })

    this.dispatchEvent(Modifier.Events.Invoked, { items })
  }

  static Names = Object.freeze({ on: Icons.ToggleOn.name, off: Icons.ToggleOff.name })
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
  }

  onToggle () {}

  toggle (toggled) {
    this.toggled = toggled
    this.onToggle()
  }
}
