import { capitalize } from './util'
import { CompoundPath } from 'paper'

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

  getCompoundPath () {
    return new CompoundPath({
      // Must explicitly add insert: false for clone
      // https://github.com/paperjs/paper.js/issues/1721
      children: this.group.clone({ insert: false }).children
        .filter((child) => child.data.collidable !== false)
    })
  }

  getIndex () {
    return this.group.index
  }

  getLayer () {
    return this.group.parent
  }

  onClick () {}

  onCollision (beam, puzzle, collision, collisionIndex, collisions, currentStep, nextStep, collisionStep) {
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
    'filter',
    'mask',
    'portal',
    'reflector',
    'terminus',
    'tile',
    'wall'
  ].map((type) => [type, capitalize(type)])))
}
