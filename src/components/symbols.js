import { Symbol } from './symbol'

export class Symbols {
  static Immutable = new Symbol('icon-immutable', 'prohibit-inset', Symbol.Weights.Fill)
  static Lock = new Symbol('icon-lock', 'lock', Symbol.Weights.Fill)
  static Move = new Symbol('icon-move', 'arrows-out-cardinal', Symbol.Weights.Bold)
  static Puzzle = new Symbol('icon-puzzle', 'puzzle-piece', Symbol.Weights.Fill)
  static RotateLeft = new Symbol('icon-rotate-left', 'arrow-counter-clockwise', Symbol.Weights.Bold)
  static RotateRight = new Symbol('icon-rotate-right', 'arrow-clockwise', Symbol.Weights.Bold)
  static Swap = new Symbol('icon-swap', 'swap', Symbol.Weights.Bold)
  static ToggleOff = new Symbol('icon-toggle-off', 'toggle-left', Symbol.Weights.Fill)
  static ToggleOn = new Symbol('icon-toggle-on', 'toggle-right', Symbol.Weights.Fill)

  static All = Object.freeze([
    Symbols.Immutable,
    Symbols.Lock,
    Symbols.Move,
    Symbols.Puzzle,
    Symbols.RotateLeft,
    Symbols.RotateRight,
    Symbols.Swap,
    Symbols.ToggleOff,
    Symbols.ToggleOn
  ])

  static ById = Object.freeze(Object.fromEntries(Symbols.All.map((icon) => [icon.id, icon])))
}
