import { capitalize, emitEvent } from './util'
import { Puzzle } from './puzzle'
import { Stateful } from './stateful'
import { EventListener } from './eventListener'

const modifiersImmutable = document.getElementById('modifiers-immutable')
const modifiersMutable = document.getElementById('modifiers-mutable')

let uniqueId = 0

export class Modifier extends Stateful {
  #container
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
      click: (event) => {
        if (!this.disabled && !this.selected) {
          this.onClick(event)
        }
      },
      deselected: this.onDeselected,
      mousedown: this.onMouseDown,
      mouseleave: this.onMouseLeave,
      mouseup: this.onMouseUp
    })
  }

  /**
   * Attach the modifier to the DOM and add listeners.
   */
  attach () {
    const li = this.#container = document.createElement('li')

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

  onClick () {
    this.selected = false
  }

  onDeselected () {
    this.update({ selected: false })
    this.tile.afterModify()
    this.dispatchEvent(Modifier.Events.Deselected)
  }

  onMouseDown () {
    if (
      !this.#mask &&
      !this.tile.modifiers.some((modifier) => [Modifier.Types.immutable, Modifier.Types.lock].includes(modifier.type))
    ) {
      this.#timeoutId = setTimeout(this.onSelected.bind(this), this.#selectionTime)
    }
  }

  onMouseLeave () {
    clearTimeout(this.#timeoutId)
  }

  onMouseUp () {
    clearTimeout(this.#timeoutId)
  }

  onSelected () {
    Modifier.deselect()

    this.update({ selected: true })
    this.tile.beforeModify()

    const mask = this.#mask = new Puzzle.Mask(this.#moveFilter.bind(this), { onClick: this.#maskOnClick.bind(this) })
    this.dispatchEvent(Puzzle.Events.Mask, { mask })
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

  #maskOnClick (puzzle, tile) {
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
