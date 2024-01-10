import { capitalize } from './util'
import { CompoundPath, Group } from 'paper'
import { Stateful } from './stateful'

export class Item extends Stateful {
  center
  data
  group
  id = Item.uniqueId++
  // Whether the item can be clicked on
  locked
  parent
  sortOrder = 100
  type

  constructor (parent, state, configuration) {
    super(state)

    this.type = state?.type || configuration?.type
    this.data = Object.assign({ id: this.id, type: this.type }, configuration?.data || {})
    this.locked = configuration?.locked !== false

    if (parent) {
      this.center = parent.center
    }

    this.parent = parent
    this.group = new Group({ data: this.data, locked: this.locked })
  }

  equals (otherItem) {
    return otherItem instanceof Item && this.id === otherItem.id
  }

  getColorElements () {
    return []
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

  onCollision (
    beam,
    puzzle,
    collision,
    collisionIndex,
    collisions,
    currentStep,
    currentStepIndex,
    nextStep,
    nextStepIndex,
    existingNextStep,
    collisionStep
  ) {
    return collisionStep
  }

  onDeselected () { }

  onInitialization () {}

  onSelected () {}

  remove () {
    this.group.remove()
  }

  toString () {
    return `[${this.type}:${this.id}]`
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

  // This should be stable per puzzle as state refers to it
  // Note that IDs will change if the puzzle configuration changes
  static uniqueId = 0
}
