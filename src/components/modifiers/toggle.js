import { Modifier } from '../modifier'
import { Icons } from '../icons'
import { baseUri } from '../util'

export class Toggle extends Modifier {
  title = 'Toggle'
  toggled

  constructor (tile, state) {
    super(...arguments)

    this.toggled = state.toggled || this.parent?.items.some(item => item.toggled)
    this.name = this.getName()
  }

  attach (tile) {
    super.attach(tile)

    this.toggled = this.tile?.items.some(item => item.toggled)
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
    items.forEach((item) => item.toggle(this.toggled))

    this.update({ name: this.getName() })

    this.dispatchEvent(Modifier.Events.Invoked, { items })
  }

  static Names = Object.freeze({ on: Icons.ToggleOn.name, off: Icons.ToggleOff.name })

  static Schema = Object.freeze({
    $id: `${baseUri}/schemas/modifiers/${Modifier.Types.toggle.toLowerCase()}`,
    properties: {
      toggled: {
        type: 'boolean'
      },
      type: {
        const: Modifier.Types.toggle
      }
    },
    required: ['type'],
    type: 'object'
  })
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
