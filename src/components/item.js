import { capitalize } from './util'
import { CompoundPath, Group } from 'paper'
import { StateManager } from './stateManager'

let uniqueId = 0

export class Item {
  center
  data
  group
  id = uniqueId++
  // Whether the item can be clicked on
  locked
  parent
  sortOrder = 100
  type

  constructor (parent, configuration) {
    const type = configuration?.type

    this.data = Object.assign({ id: this.id, type }, configuration?.data || {})
    this.locked = configuration?.locked !== false
    this.type = type

    if (parent) {
      this.center = parent.center
    }

    this.parent = parent
    this.group = new Group({ applyMatrix: false, data: this.data, locked: this.locked })
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

  getLayerIndex () {
    return this.group.index
  }

  getLayer () {
    return this.group.parent
  }

  getObjectPath () {
    return this.parent?.getObjectPath().concat([StateManager.Paths.items, this.parent.getItemIndex(this)])
  }

  onClick () {}

  onCollision (
    beam,
    puzzle,
    collision,
    collisionIndex,
    collisions,
    currentStep,
    nextStep,
    existingNextStep,
    collisionStep
  ) {
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
