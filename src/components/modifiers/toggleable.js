import { Modifier } from '../modifier'

export class Toggleable extends Modifier {
  title = 'This item can be toggled on and off.'

  constructor (item) {
    super(...arguments)

    if (typeof item.toggle !== 'function') {
      throw new Error('Item with Toggleable modifier must mix-in ToggleableItem.')
    }
  }

  attach () {
    this.name = Toggleable.Names[this.item.activated ? 'on' : 'off']
    super.attach()
  }

  onClick (event) {
    super.onClick(event)

    this.item.toggle()

    this.update({ name: Toggleable.Names[this.item.activated ? 'on' : 'off'] })
  }

  static Names = Object.freeze({ on: 'toggle_on', off: 'toggle_off ' })
  static Type = 'Toggleable'
}

/**
 * A mixin for Item which provides toggle behaviors.
 *
 * @param SuperClass
 * @returns {{new(): ToggleableItem, activated, prototype: ToggleableItem}}
 * @constructor
 */
export const toggleable = (SuperClass) => class ToggleableItem extends SuperClass {
  activated

  toggle () {
    this.activated = !this.activated
    this.update()
  }
}
