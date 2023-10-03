import { capitalize } from './util'

export class Item {
  center
  group
  parent
  type

  constructor (parent) {
    if (parent) {
      this.center = parent.center
    }

    this.parent = parent
  }

  onClick () {}

  onDeselected () { }

  onSelected () {}

  update () {}

  static Types = Object.freeze(Object.fromEntries([
    'beam',
    'mask',
    'reflector',
    'terminus',
    'tile',
    'wall'
  ].map((type) => [type, capitalize(type)])))
}
