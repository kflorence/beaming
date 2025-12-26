import paper, { SymbolDefinition } from 'paper'

export class Symbol {
  definition
  element
  id
  item
  name

  constructor (id, name) {
    this.id = id
    this.name = name
    this.element = document.getElementById(this.id)
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
}
