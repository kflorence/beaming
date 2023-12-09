import { Path, Point } from 'paper'
import { Item } from '../item'
import { itemFactory } from '../itemFactory'
import { emitEvent } from '../util'
import { modifierFactory } from '../modifierFactory'

export class Tile extends Item {
  selected = false

  #ui

  constructor (coordinates, layout, parameters, state) {
    super(null, state, { locked: false })

    this.#ui = Tile.ui(layout, parameters, state, { coordinates, type: this.type })

    this.center = this.#ui.center
    this.coordinates = coordinates
    this.hexagon = this.#ui.hexagon
    this.parameters = parameters
    this.styles = this.#ui.styles

    this.group.addChild(this.#ui.hexagon)

    // These need to be last, since they reference this
    this.items = (state.items || [])
      .map((state) => itemFactory(this, state))
      .filter((item) => item !== undefined)

    this.modifiers = (state.modifiers || [])
      .map((state) => modifierFactory(this, state))
      .filter((modifier) => modifier !== undefined)
  }

  addItem (item) {
    this.items.unshift(item)
  }

  addModifier (modifier) {
    this.modifiers.unshift(modifier)
  }

  afterModify () {
    this.setStyle('default')
  }

  beforeModify () {
    this.group.bringToFront()
    this.setStyle('edit')
  }

  getState () {
    const state = { type: this.type }

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

  onClick (event) {
    console.debug(this.coordinates.axial.toString(), this)
    this.items.forEach((item) => item.onClick(event))
  }

  onDeselected (selectedTile) {
    this.#ui.hexagon.style = this.styles.default
    this.items.forEach((item) => item.onDeselected())
    this.modifiers.forEach((modifier) => modifier.detach())

    emitEvent(Tile.Events.Deselected, { selectedTile, deselectedTile: this })
  }

  onSelected (deselectedTile) {
    this.group.bringToFront()
    this.#ui.hexagon.style = this.styles.selected
    this.items.forEach((item) => item.onSelected())
    this.modifiers.forEach((modifier) => modifier.attach())
  }

  removeItem (item) {
    const index = this.items.indexOf(item)
    if (index >= 0) {
      this.items.splice(index, 1)
    }
  }

  removeModifier (modifier) {
    const index = this.modifiers.indexOf(modifier)
    if (index >= 0) {
      this.modifiers.splice(index, 1)
    }
  }

  setStyle (style) {
    this.hexagon.set(this.styles[style])
  }

  teardown () {
    this.modifiers.forEach((modifier) => modifier.detach())
  }

  toString () {
    return this.coordinates.offset.toString()
  }

  static parameters (height) {
    const circumradius = height / 2
    const width = Math.sqrt(3) * circumradius
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

  static ui (layout, parameters, configuration, data) {
    const center = new Point(
      layout.startingOffsetX + parameters.inradius + layout.column * parameters.width,
      layout.startingOffsetY + parameters.circumradius + layout.row * parameters.offsetY
    )

    const dashWidth = parameters.circumradius / 10

    const styles = Object.assign(
      {},
      Tile.Styles,
      {
        edit: Object.assign({ dashArray: [dashWidth, dashWidth] }, Tile.Styles.edit)
      },
      configuration.style || {}
    )

    const hexagon = new Path.RegularPolygon({
      center,
      closed: true,
      data,
      radius: parameters.circumradius,
      sides: 6,
      style: styles.default
    })

    return { center, hexagon, styles }
  }

  static Events = Object.freeze({
    Deselected: 'tile-deselected',
    Selected: 'tile-selected'
  })

  static Styles = Object.freeze({
    default: {
      dashArray: [],
      fillColor: 'white',
      strokeColor: '#666',
      strokeWidth: 1
    },
    edit: {
      strokeColor: 'black',
      strokeWidth: 2
    },
    selected: {
      strokeColor: 'black',
      strokeWidth: 2
    }
  })
}
