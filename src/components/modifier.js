import { capitalize, emitEvent } from './util'
import { Puzzle } from './puzzle'
import { Stateful } from './stateful'
import { EventListeners } from './eventListeners'
import { Interact } from './interact'
import { Item } from './item'
import { Icons } from './icons'

const modifiersImmutable = document.getElementById('modifiers-immutable')
const modifiersMutable = document.getElementById('modifiers-mutable')

let uniqueId = 0

export class Modifier extends Stateful {
  #container
  #down = false
  #eventListener = new EventListeners({ context: this })
  #mask
  #selectionTime = 500
  #timeoutId

  configuration
  element
  disabled = false
  id = uniqueId++
  immutable = false
  name
  selected = false
  tile
  title
  type

  constructor (tile, state) {
    super(state)

    this.tile = tile
    this.type = state.type
  }

  /**
   * Attach the modifier to the DOM and add listeners.
   */
  attach () {
    const li = this.#container = document.createElement('li')

    li.classList.add(['modifier', this.type.toLowerCase()].join('-'))

    if (this.immutable) {
      this.disabled = true
    }

    const span = this.element = document.createElement('span')

    span.classList.add('material-symbols-outlined', 'fill')

    li.append(span)

    this.update()

    this.#eventListener.add([
      { type: 'deselected', handler: this.onDeselected },
      { type: 'pointerdown', handler: this.onPointerDown },
      { type: 'pointerleave', handler: this.onPointerUp },
      { type: 'pointerup', handler: this.onPointerUp }
    ], { element: li })

    this.immutable ? modifiersImmutable.append(li) : modifiersMutable.append(li)
  }

  /**
   * Remove listeners and the modifier from the DOM.
   */
  detach () {
    if (!this.#container) {
      return
    }

    Modifier.deselect()

    this.#eventListener.remove()
    this.#container.remove()

    this.selected = false
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
    this.remove()
    tile.addModifier(this)
    this.tile = tile
  }

  moveFilter (tile) {
    // Mask immutable tiles
    return tile.modifiers.some(Modifier.immutable) ||
      // Mask tiles that only contain immutable items
      tile.items.every(Item.immutable)
  }

  onDeselected () {
    this.update({ selected: false })
    this.tile.afterModify()
    this.dispatchEvent(Modifier.Events.Deselected)
  }

  onPointerDown (event) {
    if (event.button !== 0) {
      // Support toggle on non-primary pointer button
      this.onToggle(event)
    } else {
      this.#down = true
      if (!this.#mask && !this.tile.modifiers.some(Modifier.immovable)) {
        // No active mask and modifiers are not immovable
        this.#timeoutId = setTimeout(this.onSelected.bind(this), this.#selectionTime)
      }
    }
  }

  onPointerUp (event) {
    clearTimeout(this.#timeoutId)

    if (this.#down && !this.disabled && !this.selected) {
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

  onSelected () {
    Modifier.deselect()

    Interact.vibrate()

    this.update({ selected: true })

    const mask = this.#mask = new Puzzle.Mask({
      id: this.toString(),
      onMask: () => this.tile.beforeModify(),
      onTap: this.#maskOnTap.bind(this),
      tileFilter: this.#moveFilter.bind(this)
    })

    this.dispatchEvent(Puzzle.Events.Mask, { mask })
  }

  onTap () {
    this.selected = false
  }

  onToggle () {
    Interact.vibrate()
  }

  remove () {
    this.detach()
    this.tile.removeModifier(this)
    this.tile = null
  }

  toString () {
    return [this.name, this.id].join(':')
  }

  update (options) {
    options = Object.assign(
      { disabled: this.disabled, selected: this.selected, name: this.name, title: this.title },
      options || {}
    )

    if (!this.immutable) {
      this.disabled = options.disabled
    }

    this.name = options.name
    this.title = options.title
    this.selected = options.selected

    if (this.#container) {
      this.#container.classList.toggle('disabled', this.disabled)
      this.#container.classList.toggle('selected', this.selected)
      this.element.textContent = this.name
      this.element.title = this.title
    }
  }

  #maskOnTap (puzzle, tile) {
    if (tile && tile !== this.tile) {
      const fromTile = this.tile

      this.move(tile)

      puzzle.updateState()
      puzzle.updateSelectedTile(tile)
      puzzle.unmask()

      this.dispatchEvent(Modifier.Events.Moved, { fromTile })
    } else {
      Modifier.deselect()
      puzzle.unmask()
    }

    this.#mask = undefined
    this.update({ selected: false })
  }

  #moveFilter (tile) {
    // Always include current tile
    return !tile.equals(this.tile) && this.moveFilter(tile)
  }

  static deselect () {
    const selectedModifier = document.querySelector('.modifiers .selected')
    if (selectedModifier) {
      selectedModifier.dispatchEvent(new CustomEvent('deselected'))
    }
  }

  static immovable (modifier) {
    return Modifier.immovableTypes.includes(modifier.type)
  }

  static immutable (modifier) {
    return modifier.type === Modifier.Types.immutable
  }

  static Events = Object.freeze({
    Deselected: 'modifier-deselected',
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

  static immovableTypes = [Modifier.Types.immutable, Modifier.Types.lock]
}
