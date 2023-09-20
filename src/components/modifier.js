const modifiersImmutable = document.getElementById('modifiers-immutable')
const modifiersMutable = document.getElementById('modifiers-mutable')

export class Modifier {
  #container
  #element

  immutable = false
  item
  name
  selected = false
  title

  constructor (item, { selected }) {
    this.onClick = this.onClick.bind(this)
    this.onDeselected = this.onDeselected.bind(this)

    this.item = item
    this.selected = selected || false
  }

  /**
   * Attach the modifier to the DOM and add listeners.
   */
  attach () {
    const li = this.#container = document.createElement('li')
    const button = this.#element = document.createElement('button')

    button.classList.add('material-symbols-outlined')

    this.update()

    button.addEventListener('click', this.onClick)
    button.addEventListener('deselected', this.onDeselected)

    li.append(button)

    this.immutable ? modifiersImmutable.append(li) : modifiersMutable.append(li)
  }

  /**
   * Remove listeners and the modifier from the DOM.
   */
  detach () {
    this.#element.removeEventListener('click', this.onClick)
    this.#container.remove()

    this.#element = undefined
    this.#container = undefined
  }

  onClick (event) {
    const selectedModifier = document.querySelector('.modifiers .selected')
    if (selectedModifier) {
      selectedModifier.dispatchEvent(new Event('deselected'))
    }
    this.update({ selected: true })
  }

  onDeselected (event) {
    this.update({ selected: false })
  }

  update (options) {
    options = Object.assign(
      { selected: this.selected, name: this.name, title: this.title },
      options || {}
    )

    this.selected = options.selected
    this.#element.classList.toggle('selected', this.selected)
    this.#element.textContent = options.name
    this.#element.title = options.title
  }
}
