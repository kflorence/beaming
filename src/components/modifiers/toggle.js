import { Modifier } from '../modifier'
import { StateManager } from '../stateManager'

export class Toggle extends Modifier {
  items
  on
  title = 'Items in this tile can be toggled between states.'
  type = Modifier.Types.toggle

  constructor (tile, { on }) {
    super(...arguments)

    this.items = this.tile.items.filter((item) => item.toggleable === true)
    this.on = on || false

    this.items.forEach((item) => {
      item.toggled = this.on
    })
  }

  attach () {
    this.name = Toggle.Names[this.on ? 'on' : 'off']
    super.attach()
  }

  onClick (event) {
    super.onClick(event)

    this.on = !this.on

    const items = this.items.filter((item) => item.toggleable)
    items.forEach((item) => item.toggle(this.on))

    this.update({ name: Toggle.Names[this.on ? 'on' : 'off'] })

    const updates = items.map((item) =>
      StateManager.Update.item(this.tile, item, item.getToggledState()))

    this.dispatchEvent(Modifier.Events.Invoked, { items, updates })
  }

  static Names = Object.freeze({ on: 'toggle_on', off: 'toggle_off ' })
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

    this.toggleable = configuration.toggleable !== false
  }

  // Items should define what state data toggle represents
  getToggledState () {}

  onToggle () {}

  toggle (toggled) {
    this.toggled = toggled
    this.onToggle()
  }
}
