import { Modifier } from '../modifier'
import { Symbols } from '../symbols.js'

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

  getSymbol () {
    return this.toggled ? Symbols.ToggleOn : Symbols.ToggleOff
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

    this.update()

    this.dispatchEvent(Modifier.Events.Invoked, { items })
  }

  updateToggled () {
    this.toggled = this.parent?.items.some(item => item.toggled) ?? false
  }

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
