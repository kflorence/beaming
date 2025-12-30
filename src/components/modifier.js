import { emitEvent, merge, uniqueId } from './util'
import { Stateful } from './stateful'
import { EventListeners } from './eventListeners'
import { Interact } from './interact'
import { Item } from './item'
import { Schema } from './schema'
import { Filter } from './filter.js'
import { Tile } from './items/tile.js'

const layoutModifiers = document.getElementById('modifiers-layout')
const tileModifiers = document.getElementById('modifiers-tile')

export class Modifier extends Stateful {
  #container
  #down = false
  #eventListener = new EventListeners({ context: this })
  #timeoutId

  configuration
  element
  immutable = false
  index
  parent
  requiresItem = true
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

    // TODO update the UI so that duplicate modifiers are not attached
    // Instead, display a number next to the modifier to indicate how many of that modifier there are

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

    if (this.parent) {
      tileModifiers.append(li)
    } else {
      layoutModifiers.append(li)
    }
  }

  isDisabled () {
    return this.immutable ||
      // The tile contains an immutable modifier
      this.tile?.modifiers.some((modifier) => modifier.type === Modifier.Types.Immutable) ||
      // The modifier requires an interactable item but the tile doesn't have any
      (this.requiresItem && !this.tile?.items.some((item) => item.type !== Item.Types.Beam)) ||
      // This is a global modifier
      (
        !this.parent && (
          // And the tile is locked
          (!this.parent && this.tile?.modifiers.some((modifier) => modifier.type === Modifier.Types.Lock)) ||
          // And the tile contains a modifier of this type already
          this.tile?.modifiers.some((modifier) => modifier.type === this.type) ||
          // And the tile already has the maximum number of modifiers stuck to it
          (!this.parent && this.tile?.modifiers.length === Tile.MaxModifiers)
        )
      )
  }

  isStuck (tile) {
    return (
      // Modifier does not belong to a tile
      !this.parent &&
      // Tile has sticky modifiers
      tile.modifiers.some((modifier) => modifier.type === Modifier.Types.StickyModifiers) &&
      // Tile has less than the maximum number of modifiers
      tile.modifiers.length < Tile.MaxModifiers
    )
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

  onInvoked (puzzle, event) {}

  onTap (event, detail) {
    this.dispatchEvent(Modifier.Events.Invoked, detail)
  }

  onToggle () {
    Interact.vibrate()
  }

  toString () {
    return [this.type, this.id].join(':')
  }

  update (options = {}) {
    this.disabled = (this.isDisabled() || options.disabled) ?? false
    this.title = options.title ?? this.title

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
