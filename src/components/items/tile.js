import { Color, Path } from 'paper'
import { Item } from '../item'
import { Items } from '../items'
import { emitEvent, getPointBetween, merge, sqrt3 } from '../util'
import { Modifiers } from '../modifiers'

export class Tile extends Item {
  coordinates
  items
  modifiers
  parameters
  path
  ref
  selected = false

  constructor (coordinates, center, parameters, state = {}) {
    state = Object.assign({ type: Item.Types.tile }, state)

    super(null, state, { locked: false })

    const dashWidth = parameters.circumradius / 10

    this.styles = {}
    Object.entries(Tile.Styles).forEach(([name, style]) => {
      this.styles[name] = Object.assign({}, style, state.style?.[name] || {})
      if (this.styles[name].dashArray === true) {
        this.styles[name].dashArray = [dashWidth, dashWidth]
      }
    })

    this.center = center
    this.coordinates = coordinates
    this.parameters = parameters
    this.ref = state.ref

    this.path = new Path.RegularPolygon({
      center,
      closed: true,
      data: { coordinates, type: this.type },
      radius: parameters.circumradius,
      sides: 6,
      style: this.styles.default
    })

    this.group.addChildren([this.path])

    // These need to be last, since they reference this
    this.items = (state.items || [])
      .map((state, index) => Items.factory(this, state, index))
      .filter((item) => item !== undefined)

    this.modifiers = (state.modifiers || [])
      // Adding 10 to index to ensure modifiers on tiles are sorted last
      .map((state, index) => Modifiers.factory(this, state, 10 + index))
      .filter((modifier) => modifier !== undefined)

    this.modifiers.forEach((modifier) => this.updateIcon(modifier))

    this.update()
  }

  addItem (item) {
    this.items.push(item)
    this.update()
  }

  addModifier (modifier) {
    this.modifiers.push(modifier)
    this.updateIcon(modifier)
  }

  afterModify () {
    this.setStyle(this.selected ? 'selected' : 'default')
    this.modifiers.forEach((modifier) => modifier.update({ disabled: false }))
  }

  beforeModify () {
    this.group.bringToFront()
    this.setStyle('edit')
    this.modifiers.forEach((modifier) => modifier.update({ disabled: true }))
  }

  getState () {
    const state = { id: this.id, type: this.type }

    if (this.ref) {
      // This property will be set if this tile was imported from one puzzle into another
      state.ref = this.ref
    }

    // Filter out beams, which are not stored in state
    const items = this.items.filter((item) => item.type !== Item.Types.beam).map((item) => item.getState())
    if (items.length) {
      state.items = items
    }

    const modifiers = this.modifiers.map((modifier) => modifier.getState())
    if (modifiers.length) {
      state.modifiers = modifiers
    }

    return state
  }

  onTap (event) {
    this.items.forEach((item) => item.onTap(event))
  }

  onDeselected (selectedTile) {
    this.selected = false
    this.path.style = this.styles.default
    this.items.forEach((item) => item.onDeselected())

    document.body.classList.remove(`tile-selected_${this.coordinates.offset.toString('_')}`)

    emitEvent(Tile.Events.Deselected, { selectedTile, deselectedTile: this })
  }

  onSelected (deselectedTile) {
    console.debug(this.toString(), 'selected')
    this.selected = true
    this.group.bringToFront()
    this.path.style = this.styles.selected
    this.items.forEach((item) => item.onSelected())

    document.body.classList.add(`tile-selected_${this.coordinates.offset.toString('_')}`)

    emitEvent(Tile.Events.Selected, { selectedTile: this, deselectedTile })
  }

  removeItem (item) {
    const index = this.items.indexOf(item)
    if (index >= 0) {
      this.items.splice(index, 1)
      this.update()
    }
  }

  removeModifier (modifier) {
    const index = this.modifiers.indexOf(modifier)
    if (index >= 0) {
      this.modifiers.splice(index, 1)
      this.updateIcon(modifier)
    }
  }

  setStyle (style) {
    this.path.set(this.styles[style])
  }

  teardown () {
    this.items.forEach((item) => item.remove())
    this.modifiers.forEach((modifier) => modifier.detach())
    this.remove()
  }

  toString () {
    return `[${this.type}:${this.coordinates.offset.toString()}]`
  }

  updateIcon (modifier) {
    const index = this.modifiers.indexOf(modifier)
    if (index >= 0) {
      const position = getPointBetween(
        // Position icons starting at 12 o'clock (index 1)
        this.path.segments[(index + 1) % 6].point,
        this.center,
        (length) => length / 3
      )
      const style = { fillColor: modifier.immutable ? '#ccc' : '#333' }
      const icon = modifier.getSymbol().place(position, { style })
      icon.data = { id: modifier.id, name: modifier.name, type: modifier.type }
      const childIndex = this.group.children.findIndex((icon) => icon.data.id === modifier.id)
      if (childIndex >= 0) {
        // Update existing
        this.group.children[childIndex].replaceWith(icon)
      } else {
        this.group.addChild(icon)
      }
    }
  }

  static parameters (height = Tile.DefaultHeight) {
    // AKA "size"
    const circumradius = height / 2
    const width = sqrt3 * circumradius
    const inradius = width / 2
    const offsetY = height * (3 / 4)

    return {
      circumradius,
      height,
      inradius,
      offsetY,
      width
    }
  }

  static DefaultHeight = 160

  static Events = Object.freeze({
    Deselected: 'tile-deselected',
    Selected: 'tile-selected'
  })

  static MaxModifiers = Modifiers.Schema.maxItems

  static Schema = Object.freeze(merge(Item.schema(Item.Types.tile), {
    properties: {
      ref: {
        options: {
          hidden: true
        },
        type: 'object'
      },
      items: Items.Schema,
      modifiers: Modifiers.Schema
    }
  }))

  static Styles = Object.freeze({
    // Need to use new Color here explicitly due to:
    // https://github.com/paperjs/paper.js/issues/2049
    default: {
      dashArray: [],
      fillColor: new Color('white'),
      strokeColor: new Color('#666'),
      strokeWidth: 1
    },
    copy: {
      dashArray: true,
      strokeColor: new Color('#999'),
      strokeWidth: 2
    },
    edit: {
      dashArray: true,
      strokeColor: new Color('black'),
      strokeWidth: 2
    },
    selected: {
      dashArray: [],
      strokeColor: new Color('black'),
      strokeWidth: 2
    }
  })
}
