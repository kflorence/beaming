import paper, { SymbolDefinition } from 'paper'

export class Symbol {
  definition
  element
  id
  item
  name
  weight

  constructor (id, name, weight) {
    this.element = document.getElementById(id)
    this.id = id
    this.name = name
    this.weight = weight
  }

  getItem () {
    if (!this.item) {
      this.item = paper.project.importSVG(this.element)
      // By default, symbols will be excluded from beam collisions
      this.item.data.collidable = false
      // By default, symbols cannot be clicked on
      this.item.locked = true
    }

    return this.item
  }

  place (position, settings) {
    if (!this.definition) {
      this.definition = new SymbolDefinition(this.getItem())
    }

    if (settings) {
      this.definition.item.set(settings)
    }

    return this.definition.place(position)
  }

  static Weights = Object.freeze({
    Bold: 'bold',
    Fill: 'fill'
  })
}
