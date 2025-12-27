import { emitEvent, merge, uniqueId } from './util'
import { Stateful } from './stateful'
import { EventListeners } from './eventListeners'
import { Interact } from './interact'
import { Item } from './item'
import { Tile } from './items/tile'
import { Schema } from './schema'
import { Filter } from './filter.js'

const menu = document.getElementById('puzzle-footer-menu')

export class Modifier extends Stateful {
  #container
  #down = false
  #eventListener = new EventListeners({ context: this })
  #timeoutId

  configuration
  element
  disabled = false
  immutable = false
  index
  parent
  tile
  title
  type

  constructor (tile, state, index) {
    // Retain ID from state if it exists, otherwise generate a new one
    state.id ??= uniqueId()
    super(state)

    this.id = state.id
    this.index = index
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
      this.tile?.modifiers.some((modifier) => modifier.type === Modifier.Types.Immutable) ||
      // The tile has no interactable items
      !this.tile?.items.some((item) => item.type !== Item.Types.Beam) ||
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

    this.element = this.getIcon().getElement()
    li.append(this.element)

    this.update()

    this.#eventListener.add([
      { type: 'pointerdown', handler: this.onPointerDown },
      { type: 'pointerleave', handler: this.onPointerUp },
      { type: 'pointerup', handler: this.onPointerUp }
    ], { element: li })

    menu.append(li)
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
    emitEvent(event, Object.assign({ tile: this.tile }, detail || {}, { modifier: this }))
  }

  equals (other) {
    return other instanceof Modifier && this.id === other.id
  }

  getIcon () {}

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
    return [this.type, this.id].join(':')
  }

  update (options) {
    options = Object.assign(
      { disabled: this.disabled, title: this.title },
      options || {}
    )

    if (!this.immutable) {
      this.disabled = options.disabled
    }

    this.title = options.title

    if (this.#container) {
      this.#container.classList.toggle('disabled', this.disabled)
      this.element.className = this.getIcon().className
      this.element.title = this.title

      // Keep the tile icon in sync
      this.parent?.updateIcon(this)
    }
  }

  static immutable (modifier) {
    return modifier.type === Modifier.Types.Immutable
  }

  static schema (type) {
    return merge(Schema.typed('modifiers', type), {
      properties: {
        filters: {
          items: {
            anyOf: [
              ModifierFilterImportSeen.Schema
            ],
            headerTemplate: 'filter {{i1}}'
          },
          type: 'array'
        }
      }
    })
  }

  static Events = Object.freeze({
    Invoked: 'modifier-invoked',
    Moved: 'modifier-moved',
    Toggled: 'modifier-toggled'
  })

  static Types = Object.freeze({
    Immutable: 'immutable',
    Lock: 'lock',
    Move: 'move',
    Puzzle: 'puzzle',
    Rotate: 'rotate',
    StickyItems: 'sticky-items',
    StickyModifiers: 'sticky-modifiers',
    Swap: 'swap',
    Toggle: 'toggle'
  })
}

export class ModifierFilter extends Filter {
  static factory (state) {
    switch (true) {
      case state.type === ModifierFilter.Types.Import && state.name === ModifierFilter.Names.Seen: {
        return new ModifierFilterImportSeen(state)
      }
      default:
        throw new Error(`Unknown filter: ${state.type}, ${state.name}.`)
    }
  }

  static schema (type, name) {
    return super.schema('modifier', type, name)
  }

  static Names = Object.freeze({
    Seen: 'seen'
  })

  static Types = Object.freeze({
    Import: 'import'
  })
}

export class ModifierFilterImportSeen extends ModifierFilter {
  apply (state, layout) {
    return this.state.seen === layout.getImports()[this.state.importId]?.seen ?? false
  }

  static Name = ModifierFilter.Names.Seen
  static Type = ModifierFilter.Types.Import

  static Schema = Object.freeze(merge(
    ModifierFilter.schema(this.Type, this.Name),
    {
      properties: {
        importId: {
          type: 'string'
        },
        seen: {
          default: true,
          type: 'boolean'
        }
      },
      required: ['importId', 'seen']
    }
  ))
}
