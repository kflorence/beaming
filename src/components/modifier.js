import { capitalize, emitEvent } from './util'
import { Stateful } from './stateful'
import { EventListeners } from './eventListeners'
import { Interact } from './interact'
import { Item } from './item'
import { Icons } from './icons'
import { Tile } from './items/tile'

const modifiers = document.getElementById('modifiers')

let uniqueId = 0

export class Modifier extends Stateful {
  #container
  #down = false
  #eventListener = new EventListeners({ context: this })
  #timeoutId

  configuration
  element
  disabled = false
  id = uniqueId++
  immutable = false
  name
  parent
  tile
  title
  type

  constructor (tile, state) {
    super(state)

    this.parent = tile
    this.type = state.type
  }

  /**
   * Attach the modifier to the DOM and add listeners.
   */
  attach (tile) {
    this.tile = tile

    // Disable by default if: modifier is immutable
    this.disabled = this.immutable ||
      // The tile contains an immutable modifier
      this.tile?.modifiers.some((modifier) => modifier.type === Modifier.Types.immutable) ||
      // The tile has no interactable items
      !this.tile?.items.some((item) => item.type !== Item.Types.beam) ||
      (
        // The tile being attached to is not this modifier's parent
        !this.tile?.equals(this.parent) && (
          // The tile contains another modifier of this type already
          this.tile.modifiers.some((modifier) => modifier.type === this.type) ||
          // The tile already contains the max number of modifiers
          this.tile?.modifiers.length === Tile.MaxModifiers
        )
      )

    const li = this.#container = document.createElement('li')

    li.classList.add(['modifier', this.type.toLowerCase()].join('-'))
    li.dataset.id = this.id.toString()

    const span = this.element = document.createElement('span')

    span.classList.add('material-symbols-outlined', 'fill')

    li.append(span)

    this.update()

    this.#eventListener.add([
      { type: 'pointerdown', handler: this.onPointerDown },
      { type: 'pointerleave', handler: this.onPointerUp },
      { type: 'pointerup', handler: this.onPointerUp }
    ], { element: li })

    modifiers.append(li)
  }

  /**
   * Remove listeners and the modifier from the DOM.
   */
  detach () {
    if (!this.#container) {
      return
    }

    this.#eventListener.remove()
    this.#container.remove()

    this.element = undefined
    this.#container = undefined
  }

  dispatchEvent (event, detail) {
    emitEvent(event, Object.assign({}, detail || {}, { modifier: this, tile: this.tile }))
  }

  equals (other) {
    return other instanceof Modifier && this.id === other.id
  }

  getSymbol () {
    return Icons.ByName[this.name]
  }

  move (tile) {
    this.parent?.removeModifier(this)
    this.parent = tile
    tile?.addModifier(this)
  }

  moveFilter (tile) {
    // Mask immutable tiles
    return tile.modifiers.some(Modifier.immutable) ||
      // Mask tiles that only contain immutable items
      tile.items.every(Item.immutable)
  }

  onPointerDown (event) {
    if (event.button !== 0) {
      // Support toggle on non-primary pointer button
      this.onToggle(event)
    } else {
      this.#down = true
    }
  }

  onPointerUp (event) {
    clearTimeout(this.#timeoutId)

    if (this.#down && !this.disabled) {
      switch (event.type) {
        case 'pointerleave': {
          // Support swiping up on pointer device
          this.onToggle(event)
          break
        }
        case 'pointerup': {
          this.onTap(event)
          break
        }
      }
    }

    this.#down = false
  }

  onTap () {}

  onToggle () {
    Interact.vibrate()
  }

  toString () {
    return [this.name, this.id].join(':')
  }

  update (options) {
    options = Object.assign(
      { disabled: this.disabled, name: this.name, title: this.title },
      options || {}
    )

    if (!this.immutable) {
      this.disabled = options.disabled
    }

    this.name = options.name
    this.title = options.title

    if (this.#container) {
      this.#container.classList.toggle('disabled', this.disabled)
      this.element.textContent = this.name
      this.element.title = this.title
    }
  }

  static immutable (modifier) {
    return modifier.type === Modifier.Types.immutable
  }

  static Events = Object.freeze({
    Invoked: 'modifier-invoked',
    Moved: 'modifier-moved'
  })

  static Types = Object.freeze(Object.fromEntries([
    'immutable',
    'lock',
    'move',
    'rotate',
    'swap',
    'toggle'
  ].map((type) => [type, capitalize(type)])))
}
