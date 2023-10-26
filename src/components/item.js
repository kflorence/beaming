import { capitalize } from './util'

let uniqueId = 0

export class Item {
  center
  group
  id
  parent
  type

  constructor (parent) {
    this.id = uniqueId++

    if (parent) {
      this.center = parent.center
    }

    this.parent = parent
  }

  equals (otherItem) {
    return otherItem instanceof Item && this.id === otherItem.id
  }

  onClick () {}

  onCollision (beam, collision, currentStep, nextStep, collisionStep) {
    return collisionStep
  }

  onDeselected () { }

  onSelected () {}

  remove () {
    this.group.remove()
  }

  update () {}

  static Types = Object.freeze(Object.fromEntries([
    'beam',
    'collision',
    'mask',
    'reflector',
    'terminus',
    'tile',
    'wall'
  ].map((type) => [type, capitalize(type)])))
}
