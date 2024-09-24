import { Modifier } from '../modifier'
import { Icons } from '../icons'

export class Toggle extends Modifier {
  on
  title = 'Toggle'

  constructor (tile, { on }) {
    super(...arguments)

    this.on = on || false
    this.name = this.getName()
  }

  attach (tile) {
    super.attach(tile)
    // Consider the modifier toggled if there is at least one toggled item in the tile
    // TODO: refactor to be 'toggled' everywhere
    this.on = this.tile?.items.some((item) => item.on || item.toggled)
    this.update({ name: this.getName() })
  }

  getName () {
    return Toggle.Names[this.on ? 'on' : 'off']
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

    this.update({ name: this.getName() })

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
    this.toggled = this.toggleable && configuration.toggled
  }

  onToggle () {}

  toggle (toggled) {
    this.toggled = toggled
    this.onToggle()
  }
}
