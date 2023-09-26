import { Modifier } from '../modifier'

export class Toggle extends Modifier {
  items
  on
  title = 'Items in this tile can be toggled between states.'

  constructor(tile, { on }) {
    super(...arguments)

    this.items = this.tile.items.filter((item) => item.toggleable === true)
    this.on = on || false

    this.#toggle()
  }

  attach () {
    this.name = Toggle.Names[this.on ? 'on' : 'off']
    super.attach()
  }

  onClick (event) {
    super.onClick(event)

    this.on = !this.on
    this.#toggle()
    this.update({ name: Toggle.Names[this.on ? 'on' : 'off'] })
    this.dispatchEvent()
  }

  #toggle () {
    this.items.forEach((item) => item.toggle(this.on))
  }

  static Names = Object.freeze({ on: 'toggle_on', off: 'toggle_off ' })
  static Type = 'Toggle'
}

/**
 * A mixin for Item which provides toggle behaviors.
 *
 * @param SuperClass
 * @returns {{new(): ToggleableItem, activated, prototype: ToggleableItem}}
 * @constructor
 */
export const toggleable = (SuperClass) => class ToggleableItem extends SuperClass {
  toggleable = true
  toggled

  toggle (toggled) {
    this.toggled = toggled
    this.update()
  }
}
