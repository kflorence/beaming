import { Symbols } from './symbol.js'
import { className } from './util.js'

export class Icon {
  classes = []
  className
  name
  title
  weight

  constructor (name, weight, symbol, title) {
    this.classes = [className(Icon.ClassNamePrefix, weight), className(Icon.ClassNamePrefix, name)]
    this.className = this.classes.join(' ')
    this.name = name
    this.symbol = symbol
    this.title = title
    this.weight = weight
  }

  getElement () {
    const i = document.createElement('i')
    i.className = this.className
    i.title = this.title
    return i
  }

  static ClassNamePrefix = 'ph'
  static Weights = Object.freeze({
    Bold: 'bold',
    Fill: 'fill'
  })
}

export const Icons = Object.freeze({
  Connections: new Icon('link-simple-horizontal', Icon.Weights.Bold, null, 'Connections'),
  Immutable: new Icon('prohibit-inset', Icon.Weights.Fill, Symbols.Immutable, 'Immutable'),
  Lock: new Icon('lock', Icon.Weights.Fill, Symbols.Lock, 'Lock'),
  Move: new Icon('arrows-out-cardinal', Icon.Weights.Bold, Symbols.Move, 'Move'),
  Moves: new Icon('stack', Icon.Weights.Bold, null, 'Moves'),
  Puzzle: new Icon('puzzle-piece', Icon.Weights.Fill, Symbols.Puzzle, 'Puzzle'),
  RotateLeft: new Icon('arrow-counter-clockwise', Icon.Weights.Bold, Symbols.RotateLeft, 'Rotate Left'),
  RotateRight: new Icon('arrow-clockwise', Icon.Weights.Bold, Symbols.RotateRight, 'Rotate Right'),
  StickyItems: new Icon('sticker', Icon.Weights.Fill, Symbols.StickyItems, 'Sticky Items'),
  StickyModifiers: new Icon('push-pin', Icon.Weights.Fill, Symbols.StickyModifiers, 'Sticky Modifiers'),
  Swap: new Icon('swap', Icon.Weights.Bold, Symbols.Swap, 'Swap'),
  ToggleOff: new Icon('toggle-left', Icon.Weights.Fill, Symbols.ToggleOff, 'Toggle Off'),
  ToggleOn: new Icon('toggle-right', Icon.Weights.Fill, Symbols.ToggleOn, 'Toggle On')
})
