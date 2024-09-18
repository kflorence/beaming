import paper, { SymbolDefinition } from 'paper'

export class Symbol {
  definition
  id
  name

  constructor (id, name) {
    this.id = id
    this.name = name
  }

  place (position, settings) {
    if (!this.definition) {
      const element = document.getElementById(this.id)
      const item = paper.project.importSVG(element)
      item.data.collidable = false
      this.definition = new SymbolDefinition(item)
    }

    if (settings) {
      this.definition.item.set(settings)
    }

    return this.definition.place(position)
  }
}

