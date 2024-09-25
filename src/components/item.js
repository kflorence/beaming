import { capitalize, uniqueId } from './util'
import { CompoundPath, Group } from 'paper'
import { Stateful } from './stateful'

export class Item extends Stateful {
  center
  data
  group
  id
  immutable
  // Whether the item can be clicked on
  locked
  parent
  sortOrder = 100
  type

  constructor (parent, state, configuration) {
    // Retain ID from state if it exists, otherwise generate a new one
    state.id ??= uniqueId()

    super(state)

    this.id = state.id
    this.immutable ??= state?.immutable ?? false
    this.type = state?.type ?? configuration?.type
    if (this.type === undefined) {
      console.debug(`[Item:${this.id}]`, state)
      throw new Error('Item must have type defined')
    }

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

  onTap () {}

  onCollision ({ collisionStep }) {
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

  static immutable (item) {
    return item.immutable
  }

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
