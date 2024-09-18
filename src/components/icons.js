import { Symbol } from './symbol'

export class Icons {
  static Immutable = new Symbol('icon-immutable', 'block')
  static Lock = new Symbol('icon-lock', 'lock')
  static Move = new Symbol('icon-move', 'drag_pan')
  static RotateLeft = new Symbol('icon-rotate-left', 'rotate_left')
  static RotateRight = new Symbol('icon-rotate-right', 'rotate_right')
  static Swap = new Symbol('icon-swap', 'swap_horiz')
  static ToggleOff = new Symbol('icon-toggle-off', 'toggle_off')
  static ToggleOn = new Symbol('icon-toggle-on', 'toggle_on')

  static All = Object.freeze([
    Icons.Immutable,
    Icons.Lock,
    Icons.Move,
    Icons.RotateLeft,
    Icons.RotateRight,
    Icons.Swap,
    Icons.ToggleOff,
    Icons.ToggleOn
  ])

  static ByName = Object.freeze(Object.fromEntries(Icons.All.map((icon) => [icon.name, icon])))
}
