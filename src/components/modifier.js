import { capitalize, emitEvent } from './util'
import { Puzzle } from './puzzle'

const modifiersImmutable = document.getElementById('modifiers-immutable')
const modifiersMutable = document.getElementById('modifiers-mutable')

export class Modifier {
  #container
  #eventListeners = {}
  #selectionTime = 500
  #timeoutId

  configuration
  element
  immutable = false
  name
  selected = false
  tile
  title
  type

  constructor (tile, configuration) {
    Object.entries({
      click: (event) => {
        // Prevent calling onClick when the modifier has just been selected
        if (this.#timeoutId === 0) {
          return
        }
        this.onClick(event)
      },
      deselected: this.onDeselected,
      mousedown: this.onMouseDown,
      mouseleave: this.onMouseLeave,
      mouseup: this.onMouseUp
    }).forEach(([name, handler]) => {
      // Ensure proper 'this' context inside of event handlers
      this.#eventListeners[name] = handler.bind(this)
    })

    this.configuration = configuration
    this.tile = tile
  }

  /**
   * Attach the modifier to the DOM and add listeners.
   */
  attach () {
    const li = this.#container = document.createElement('li')
    const button = this.element = document.createElement('button')

    button.classList.add('material-symbols-outlined')

    this.update()

    // noinspection JSCheckFunctionSignatures
    Object.entries(this.#eventListeners)
      .forEach(([event, listener]) => button.addEventListener(event, listener))

    li.append(button)

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

    Object.entries(this.#eventListeners)
      .forEach(([event, listener]) => this.element.removeEventListener(event, listener))

    this.#container.remove()

    this.selected = false
    this.element = undefined
    this.#container = undefined
  }

  dispatchEvent (event, detail) {
    emitEvent(event, Object.assign({}, detail || {}, { modifier: this, tile: this.tile }))
  }

  onClick () {
    this.selected = false
  }

  onDeselected () {
    this.update({ selected: false })
    this.tile.onModifierDeselected()
    this.dispatchEvent(Modifier.Events.Deselected)
  }

  onMouseDown () {
    // Locked tiles cannot have their modifiers selected
    if (!this.tile.modifiers.some((modifier) => modifier.type === Modifier.Types.lock)) {
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
    this.#timeoutId = 0

    Modifier.deselect()

    this.update({ selected: true })
    this.tile.onModifierSelected()

    const mask = new Puzzle.Mask(
      (tile) => {
        // Include any tiles that are not immutable or locked
        return tile.modifiers.some((modifier) =>
          [Modifier.Types.immutable, Modifier.Types.lock].includes(modifier.type))
      },
      this.#maskOnClick.bind(this)
    )

    this.dispatchEvent(Puzzle.Events.Mask, { mask })
  }

  remove () {
    this.detach()
    this.tile.removeModifier(this)
  }

  update (options) {
    options = Object.assign(
      { selected: this.selected, name: this.name, title: this.title },
      options || {}
    )

    this.name = options.name
    this.title = options.title
    this.selected = options.selected

    this.element.classList.toggle('selected', this.selected)
    this.element.textContent = this.name
    this.element.title = this.title
  }

  #maskOnClick (puzzle, tile) {
    console.log('maskOnClick')
    if (tile) {
      this.remove()
      tile.addModifier(this.configuration)
      puzzle.unmask()
    } else {
      Modifier.deselect()
      puzzle.unmask()
    }
  }

  static deselect () {
    const selectedModifier = document.querySelector('.modifiers .selected')
    if (selectedModifier) {
      selectedModifier.dispatchEvent(new CustomEvent('deselected'))
    }
  }

  static Events = Object.freeze({
    Deselected: 'modifier-deselected',
    Invoked: 'modifier-invoked',
    Selected: 'modifier-selected'
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

// De-select any selected modifiers if user clicks on anything else in the footer
document.getElementById('footer').addEventListener('click', (event) => {
  if (!event.target.classList.contains('selected')) {
    Modifier.deselect()
  }
})
