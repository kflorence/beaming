import { capitalize } from './util'

export class Item {
  center
  group
  parent
  sortOrder = 100
  type

  constructor (parent) {
    if (parent) {
      this.center = parent.center
    }

    this.parent = parent
  }

  onClick () {}

  onCollision (beam, collision, currentStep, nextStep, collisionStep) {
    return collisionStep
  }

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
