import { Color, Path } from 'paper'
import { Item } from '../item'
import { itemFactory } from '../itemFactory'
import { emitEvent, getPointBetween, sqrt3 } from '../util'
import { modifierFactory } from '../modifierFactory'

export class Tile extends Item {
  path
  selected = false

  constructor (coordinates, center, parameters, state) {
    super(null, state, { locked: false })

    const dashWidth = parameters.circumradius / 10

    this.styles = Object.assign(
      {},
      Tile.Styles,
      {
        edit: Object.assign({ dashArray: [dashWidth, dashWidth] }, Tile.Styles.edit)
      },
      state.style || {}
    )

    this.center = center
    this.coordinates = coordinates
    this.parameters = parameters

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
      .map((state, index) => itemFactory(this, state, index))
      .filter((item) => item !== undefined)

    this.modifiers = (state.modifiers || [])
      .map((state, index) => modifierFactory(this, state, index))
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

    // Filter out beams, which are not stored in state
    const items = this.items.filter((item) => item.type !== Item.Types.beam).map((item) => item.getState())
    if (items.length) {
      state.items = items
    }

    const modifiers = this.modifiers.map((modifier) => modifier.getState())
    if (modifiers.length) {
      state.modifiers = modifiers
    }

    // noinspection JSValidateTypes
    return state
  }

  onTap (event) {
    this.items.forEach((item) => item.onTap(event))
  }

  onDeselected (selectedTile) {
    this.selected = false
    this.path.style = this.styles.default
    this.items.forEach((item) => item.onDeselected())

    emitEvent(Tile.Events.Deselected, { selectedTile, deselectedTile: this })
  }

  onSelected (deselectedTile) {
    console.debug(this.toString(), 'selected')
    this.selected = true
    this.group.bringToFront()
    this.path.style = this.styles.selected
    this.items.forEach((item) => item.onSelected())
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
  }

  toString () {
    return `[${this.type}:${this.coordinates.offset.toString()}]`
  }

  updateIcon (modifier) {
    const index = this.modifiers.indexOf(modifier)
    if (index >= 0) {
      const position = getPointBetween(
        this.path.segments[index].point,
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

  static Empty = Object.freeze({
    items: [],
    modifiers: [],
    type: Item.Types.tile
  })

  static Events = Object.freeze({
    Deselected: 'tile-deselected',
    Selected: 'tile-selected'
  })

  static MaxModifiers = 6

  static Styles = Object.freeze({
    // Need to use new Color here explicitly due to:
    // https://github.com/paperjs/paper.js/issues/2049
    default: {
      dashArray: [],
      fillColor: new Color('white'),
      strokeColor: new Color('#666'),
      strokeWidth: 1
    },
    edit: {
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
