import { uniqueId } from './util'
import { CompoundPath, Group, PathItem } from 'paper'
import { Stateful } from './stateful'
import { Schema } from './schema'
import { Modifier } from './modifier.js'

export class Item extends Stateful {
  center
  clickable
  data
  group
  id
  immutable
  parent
  sortOrder = 100
  type

  constructor (parent, state, configuration = {}) {
    // Retain ID from state if it exists, otherwise generate a new one
    state.id ??= uniqueId()

    super(state)

    this.id = state.id
    this.clickable ??= state.clickable ?? configuration.clickable ?? false
    this.immutable ??= state.immutable ?? configuration.immutable ?? false
    this.type ??= state.type ?? configuration.type

    if (this.type === undefined) {
      console.debug(`[Item:${this.id}]`, state, configuration)
      throw new Error('Item must have type defined')
    }

    this.data = Object.assign({ id: this.id, type: this.type }, configuration.data ?? {})

    if (parent) {
      this.center = parent.center
    }

    this.parent = parent

    // If the parent is hidden, hide this too
    const visible = parent?.group?.visible ?? true
    this.group = new Group({ data: this.data, locked: !this.clickable, visible })
  }

  equals (otherItem) {
    return otherItem instanceof Item && this.id === otherItem.id
  }

  getColors (tile) {
    return []
  }

  getCompoundPath () {
    return new CompoundPath({
      // Must explicitly add insert: false for clone
      // https://github.com/paperjs/paper.js/issues/1721
      children: this.group.clone({ insert: false }).children
        .filter((child) => child instanceof PathItem && child.data.collidable !== false)
    })
  }

  getIndex () {
    return this.group.index
  }

  getLayer () {
    return this.group.layer
  }

  isMovable () {
    return false
  }

  isStuck () {
    return this.immutable ||
      this.parent.modifiers.some((modifier) => Item.StickyModifierTypes.includes(modifier.type))
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

  update () {
    if (this.group) {
      // Keep in sync with parent visibility
      this.group.visible = this.parent?.group?.visible ?? this.group.visible ?? true
    }
  }

  static immutable (item) {
    return item.immutable
  }

  static schema (type) {
    return Schema.typed('item', type)
  }

  static StickyModifierTypes = [Modifier.Types.Immutable, Modifier.Types.Lock, Modifier.Types.StickyItems]

  static Types = Object.freeze({
    Beam: 'beam',
    Collision: 'collision',
    Filter: 'filter',
    Mask: 'mask',
    Modifier: 'modifier',
    Portal: 'portal',
    Reflector: 'reflector',
    Terminus: 'terminus',
    Tile: 'tile',
    Wall: 'wall'
  })
}
