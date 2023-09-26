import { Color, Group, Path, Point } from 'paper'
import { Terminus } from './items/terminus'
import { Reflector } from './items/reflector'
import { Wall } from './items/wall'
import { Immutable } from './modifiers/immutable'
import { Lock } from './modifiers/lock'
import { Rotate } from './modifiers/rotate'
import { Toggle } from './modifiers/toggle'

export class Tile {
  #ui

  selected = false

  constructor ({ coordinates, layout, parameters, configuration }) {
    this.#ui = Tile.ui(coordinates, layout, parameters, configuration)

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

  onClick (event) {
    this.items.forEach((item) => item.onClick(event))
  }

  onDeselected () {
    this.#ui.hexagon.style = this.styles.default
    this.items.forEach((item) => item.onDeselected())
    this.modifiers.forEach((modifier) => modifier.detach())
  }

  onSelected () {
    this.group.bringToFront()
    this.#ui.hexagon.style = this.styles.selected
    this.items.forEach((item) => item.onSelected())
    this.modifiers.forEach((modifier) => modifier.attach())
  }

  #itemFactory (configuration) {
    let item

    switch (configuration.type) {
      case Terminus.Type:
        item = new Terminus(this, configuration)
        break
      case Reflector.Type:
        item = new Reflector(this, configuration)
        break
      case Wall.Type:
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
      case Immutable.Type:
        modifier = new Immutable(this, configuration)
        break
      case Lock.Type:
        modifier = new Lock(this, configuration)
        break
      case Rotate.Type:
        modifier = new Rotate(this, configuration)
        break
      case Toggle.Type:
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

  static ui (coordinates, layout, parameters, configuration) {
    const data = { coordinates, type: Tile.Type }

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
      insert: false,
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

  static Type = 'Tile'
}
