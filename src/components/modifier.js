import { Events } from './util'

const modifiersImmutable = document.getElementById('modifiers-immutable')
const modifiersMutable = document.getElementById('modifiers-mutable')

export class Modifier {
  #container
  #eventListeners = {}
  #selectionTime = 500
  #timeoutId = 0

  element
  immutable = false
  name
  selected = false
  tile
  title
  type

  constructor (tile, { type }) {
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

    this.tile = tile
    this.type = type
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
    Object.entries(this.#eventListeners)
      .forEach(([event, listener]) => this.element.removeEventListener(event, listener))

    this.#container.remove()

    this.selected = false
    this.element = undefined
    this.#container = undefined
  }

  dispatchEvent () {
    document.dispatchEvent(new CustomEvent(Events.ItemModified, { detail: { modifier: this, type: this.type } }))
  }

  onClick () {
    this.selected = false
  }

  onDeselected () {
    this.update({ selected: false })
  }

  onMouseDown () {
    this.#timeoutId = setTimeout(this.onSelected.bind(this), this.#selectionTime)
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

  static deselect () {
    const selectedModifier = document.querySelector('.modifiers .selected')
    if (selectedModifier) {
      selectedModifier.dispatchEvent(new Event('deselected'))
    }
  }
}

// De-select any selected modifiers if user clicks on anything else in the footer
document.getElementById('footer').addEventListener('click', (event) => {
  if (!event.target.classList.contains('selected')) {
    Modifier.deselect()
  }
})
