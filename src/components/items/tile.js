import { Color, Path } from 'paper'
import { Item } from '../item'
import { Items } from '../items'
import { emitEvent, getPointBetween, merge, removeEmpties } from '../util'
import { Modifiers } from '../modifiers'
import { Flag as BaseFlag, Flags } from '../flag.js'

// Incrementing value for Tile flags
let flagValue = 0

export class Tile extends Item {
  coordinates
  flags
  items = []
  modifiers = []
  parameters
  path
  ref

  constructor (layout, coordinates, center, parameters, state = {}) {
    state = Object.assign({ type: Item.Types.Tile }, state)

    super(layout, state, { clickable: true })

    const dashWidth = parameters.circumradius / 10

    this.styles = {}
    Object.entries(Tile.Styles).forEach(([name, style]) => {
      this.styles[name] = Object.assign({}, style, state.style?.[name] || {})
      if (this.styles[name].dashArray === true) {
        this.styles[name].dashArray = [dashWidth, dashWidth]
      }
    })

    this.flags = new Flags(state.flags)

    this.center = center
    this.coordinates = coordinates
    this.parameters = parameters
    this.ref = state.ref

    this.path = new Path.RegularPolygon({
      center,
      closed: true,
      // Data should only contain properties that don't change
      data: { coordinates, type: this.type },
      radius: parameters.circumradius,
      sides: 6
    })

    this.setStyle()

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
    this.flags.remove(Tile.Flags.Edit)
    this.modifiers.forEach((modifier) => modifier.update({ disabled: false }))
    this.update()
  }

  beforeModify () {
    this.group.bringToFront()
    this.flags.add(Tile.Flags.Edit)
    this.modifiers.forEach((modifier) => modifier.update({ disabled: true }))
    this.update()
  }

  getState () {
    // Filter out beams, which are not stored in state
    const items = this.items.filter((item) => item.type !== Item.Types.Beam).map((item) => item.getState())
    const modifiers = this.modifiers.map((modifier) => modifier.getState())

    return removeEmpties({
      id: this.id,
      type: this.type,
      ref: this.ref,
      items,
      modifiers
    })
  }

  onDeselected (selectedTile) {
    this.flags.remove(Tile.Flags.Selected)
    this.items.forEach((item) => item.onDeselected())
    this.update()

    document.body.classList.remove(`tile-selected_${this.coordinates.offset.toString('_')}`)

    emitEvent(Tile.Events.Deselected, { selectedTile, deselectedTile: this })
  }

  onSelected (deselectedTile) {
    console.debug(this.toString(), 'selected')
    this.group.bringToFront()
    this.flags.add(Tile.Flags.Selected)
    this.items.forEach((item) => item.onSelected())
    this.update()

    document.body.classList.add(`tile-selected_${this.coordinates.offset.toString('_')}`)

    emitEvent(Tile.Events.Selected, { selectedTile: this, deselectedTile })
  }

  onTap (event) {
    this.items.forEach((item) => item.onTap(event))
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

  setStyle () {
    const style = Object.assign({}, Tile.Styles.default)
    Object.values(Tile.Flags)
      .filter((flag) => this.flags.has(flag))
      .forEach((flag) => Object.assign(style, this.styles[flag.name]))
    this.path.set({ style })
  }

  teardown () {
    this.items.forEach((item) => item.remove())
    this.modifiers.forEach((modifier) => modifier.detach())
    this.remove()
  }

  toString () {
    return `[${this.type}:${this.coordinates.offset.toString()}]`
  }

  update () {
    this.setStyle()
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
      const icon = modifier.getIcon()
      const item = icon.symbol.place(position, { locked: true, style })
      item.data = { id: modifier.id, name: icon.symbol.name, type: modifier.type }
      const childIndex = this.group.children.findIndex((item) => item.data.id === modifier.id)
      if (childIndex >= 0) {
        // Update existing
        this.group.children[childIndex].replaceWith(item)
      } else {
        this.group.addChild(item)
      }
    }
  }

  static DefaultHeight = 160

  static Events = Object.freeze({
    Deselected: 'tile-deselected',
    Selected: 'tile-selected'
  })

  static MaxModifiers = 6

  static schema = () => Object.freeze(merge(Item.schema(Item.Types.Tile), {
    properties: {
      flags: {
        options: {
          hidden: true
        },
        type: 'number'
      },
      ref: {
        options: {
          hidden: true
        },
        type: 'object'
      },
      items: Items.schema(),
      modifiers: Modifiers.schema()
    }
  }))

  static Flag = class extends BaseFlag {
    constructor (name) {
      super()
      this.name = name
      this.value = 1 << flagValue++
    }
  }

  static Flags = Object.freeze({
    Copy: new Tile.Flag('copy'),
    Edit: new Tile.Flag('edit'),
    // TODO implement hidden
    Hidden: new Tile.Flag('hidden'),
    Placeholder: new Tile.Flag('placeholder'),
    Selected: new Tile.Flag('selected')
  })

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
    placeholder: {
      dashArray: [],
      fillColor: new Color('#bbb'),
      strokeColor: new Color('#999'),
      strokeWidth: 1
    },
    selected: {
      dashArray: [],
      strokeColor: new Color('black'),
      strokeWidth: 2
    }
  })
}
