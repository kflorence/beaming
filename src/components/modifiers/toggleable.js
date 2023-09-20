import { Modifier } from '../modifier'
import { ToggleableItem } from '../item'

export class Toggleable extends Modifier {
  title = 'Toggleable'

  constructor (item, configuration) {
    super(item, configuration)

    if (!(item instanceof ToggleableItem)) {
      throw new Error('Item with Toggleable modifier must be an instance of ToggleableItem')
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
