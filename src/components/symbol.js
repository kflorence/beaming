import paper, { SymbolDefinition } from 'paper'
import { className } from './util.js'

export class Symbol {
  definition
  element
  id
  item
  name

  constructor (name) {
    const id = className(Symbol.IdPrefix, name)
    this.element = document.getElementById(id)
    this.id = id
    this.name = name
  }

  getItem () {
    if (!this.item) {
      this.item = paper.project.importSVG(this.element, { expandShapes: true, insert: false })
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

  static IdPrefix = 'symbol'
}

export const Symbols = Object.freeze({
  Immutable: new Symbol('immutable'),
  Lock: new Symbol('lock'),
  Move: new Symbol('move'),
  Puzzle: new Symbol('puzzle'),
  RotateLeft: new Symbol('rotate-left'),
  RotateRight: new Symbol('rotate-right'),
  StickyItems: new Symbol('sticky-items'),
  StickyModifiers: new Symbol('sticky-modifiers'),
  Swap: new Symbol('swap'),
  ToggleOff: new Symbol('toggle-off'),
  ToggleOn: new Symbol('toggle-on')
})
