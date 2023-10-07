import { Group, Path, Point } from 'paper'
import { Terminus } from './terminus'
import { Reflector } from './reflector'
import { Wall } from './wall'
import { Immutable } from '../modifiers/immutable'
import { Lock } from '../modifiers/lock'
import { Rotate } from '../modifiers/rotate'
import { Toggle } from '../modifiers/toggle'
import { Item } from '../item'
import { Modifier } from '../modifier'
import { emitEvent } from '../util'

export class Tile extends Item {
  selected = false
  type = Item.Types.tile

  #ui

  constructor ({ coordinates, layout, parameters, configuration }) {
    super(null)

    this.#ui = Tile.ui(coordinates, layout, parameters, configuration, this.type)

    this.center = this.#ui.center
    this.coordinates = coordinates
    this.group = this.#ui.group
    this.hexagon = this.#ui.hexagon
    this.parameters = parameters
    this.styles = this.#ui.styles

    // This needs to be last, since it references this
    this.items = (configuration.items || [])
      .map((configuration) => this.#itemFactory(configuration))
      .filter((item) => item !== undefined)

    this.modifiers = (configuration.modifiers || [])
      .map((configuration) => this.#modifierFactory(configuration))
  }

  addItem (item) {
    this.items.unshift(item)
  }

  addModifier (configuration) {
    this.modifiers.unshift(this.#modifierFactory(configuration))
  }

  onClick (event) {
    console.log(this.items)
    this.items.forEach((item) => item.onClick(event))
  }

  onDeselected (selectedTile) {
    this.#ui.hexagon.style = this.styles.default
    this.items.forEach((item) => item.onDeselected())
    this.modifiers.forEach((modifier) => modifier.detach())

    emitEvent(Tile.Events.Deselected, { selectedTile, deselectedTile: this })
  }

  onModifierSelected () {
    const width = this.parameters.circumradius / 10
    this.hexagon.dashArray = [width, width]
  }

  onModifierDeselected () {
    this.hexagon.dashArray = []
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

  teardown () {
    this.modifiers.forEach((modifier) => modifier.detach())
  }

  #itemFactory (configuration) {
    let item

    switch (configuration.type) {
      case Item.Types.terminus:
        item = new Terminus(this, configuration)
        break
      case Item.Types.reflector:
        item = new Reflector(this, configuration)
        break
      case Item.Types.wall:
        item = new Wall(this, configuration)
        break
      default:
        console.error('Ignoring item with unknown type: ' + configuration.type)
        break
    }

    return item
  }

  #modifierFactory (configuration) {
    let modifier

    switch (configuration.type) {
      case Modifier.Types.immutable:
        modifier = new Immutable(this, configuration)
        break
      case Modifier.Types.lock:
        modifier = new Lock(this, configuration)
        break
      case Modifier.Types.rotate:
        modifier = new Rotate(this, configuration)
        break
      case Modifier.Types.toggle:
        modifier = new Toggle(this, configuration)
        break
      default:
        console.error('Ignoring modifier with unknown type: ' + configuration.type)
        break
    }

    return modifier
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

  static ui (coordinates, layout, parameters, configuration, type) {
    const data = { coordinates, type }

    const center = new Point(
      layout.startingOffsetX + parameters.inradius + layout.column * parameters.width,
      layout.startingOffsetY + parameters.circumradius + layout.row * parameters.offsetY
    )

    const styles = Object.assign(
      {},
      Tile.Styles,
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

    const group = new Group({
      children: [hexagon],
      // Allow this group to be clicked on
      locked: false
    })

    return { center, data, group, hexagon, styles }
  }

  static Events = Object.freeze({
    Deselected: 'tile-deselected',
    Selected: 'tile-selected'
  })

  static Styles = Object.freeze({
    default: {
      fillColor: 'white',
      strokeColor: '#666',
      strokeWidth: 1
    },
    selected: {
      strokeColor: 'black',
      strokeWidth: 2
    }
  })
}
