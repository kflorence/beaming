import { capitalize, emitEvent } from './util'
import { Puzzle } from './puzzle'
import { Stateful } from './stateful'
import { EventListener } from './eventListener'

const modifiersImmutable = document.getElementById('modifiers-immutable')
const modifiersMutable = document.getElementById('modifiers-mutable')

let uniqueId = 0

export class Modifier extends Stateful {
  #container
  #down = false
  #eventListener
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

    this.#eventListener = new EventListener(this, {
      deselected: this.onDeselected,
      pointerdown: this.onPointerDown,
      pointerleave: this.onPointerUp,
      pointerup: this.onPointerUp
    })
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

    this.#eventListener.addEventListeners(li)

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

    this.#eventListener.removeEventListeners()
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

  move (tile) {
    this.remove()
    tile.addModifier(this)
    this.tile = tile
  }

  moveFilter (tile) {
    // Filter out immutable tiles
    return tile.modifiers.some((modifier) => modifier.type === Modifier.Types.immutable)
  }

  onDeselected () {
    this.update({ selected: false })
    this.tile.afterModify()
    this.dispatchEvent(Modifier.Events.Deselected)
  }

  onPointerDown (event) {
    console.log('onPointerDown', event)
    this.#down = true
    if (
      !this.#mask &&
      !this.tile.modifiers.some((modifier) => [Modifier.Types.immutable, Modifier.Types.lock].includes(modifier.type))
    ) {
      this.#timeoutId = setTimeout(this.onSelected.bind(this), this.#selectionTime)
    }
  }

  onPointerUp (event) {
    clearTimeout(this.#timeoutId)

    if (event.type === 'pointerup' && this.#down && !this.disabled && !this.selected) {
      this.onTap(event)
    }

    this.#down = false
  }

  onSelected () {
    Modifier.deselect()

    this.update({ selected: true })
    this.tile.beforeModify()

    const mask = this.#mask = new Puzzle.Mask(this.#moveFilter.bind(this), { onTap: this.#maskOnTap.bind(this) })
    this.dispatchEvent(Puzzle.Events.Mask, { mask })
  }

  onTap () {
    this.selected = false
  }

  remove () {
    this.detach()
    this.tile.removeModifier(this)
    this.tile = null
  }

  update (options) {
    options = Object.assign(
      { disabled: this.disabled, selected: this.selected, name: this.name, title: this.title },
      options || {}
    )

    this.disabled = options.disabled
    this.name = options.name
    this.title = options.title
    this.selected = options.selected

    this.#container.classList.toggle('disabled', this.disabled)
    this.#container.classList.toggle('selected', this.selected)
    this.element.textContent = this.name
    this.element.title = this.title
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
}
