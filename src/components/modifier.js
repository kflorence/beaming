import { capitalize, emitEvent } from './util'
import { Puzzle } from './puzzle'
import { StateManager } from './stateManager'

const modifiersImmutable = document.getElementById('modifiers-immutable')
const modifiersMutable = document.getElementById('modifiers-mutable')

let uniqueId = 0

export class Modifier {
  #container
  #eventListeners = {}
  #selectionTime = 500
  #timeoutId

  configuration
  element
  id = uniqueId++
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

  equals (other) {
    return other instanceof Modifier && this.id === other.id
  }

  getObjectPath () {
    return this.tile.getObjectPath().concat([StateManager.Paths.modifiers, this.tile.getModifierIndex(this)])
  }

  move (tile) {
    this.remove()
    tile.addModifier(this)
    this.tile = tile
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
    this.tile.beforeModify()

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
    this.tile = null
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
    if (tile && tile !== this.tile) {
      const fromObjectPath = this.getObjectPath()
      const fromTile = this.tile

      this.move(tile)

      const move = [new StateManager.Update(StateManager.Update.Types.move, fromObjectPath, this.getObjectPath())]
      this.dispatchEvent(Modifier.Events.Moved, { fromTile, move })

      puzzle.updateSelectedTile(tile)
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

// De-select any selected modifiers if user clicks on anything else in the footer
document.getElementById('footer').addEventListener('click', (event) => {
  if (!event.target.classList.contains('selected')) {
    Modifier.deselect()
  }
})
