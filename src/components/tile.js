import { Group, Path, Point } from 'paper'
import { Terminus } from './items/terminus'
import { Reflector } from './items/reflector'

export class Tile {
  #ui

  selected = false

  constructor ({ coordinates, layout, parameters, configuration }) {
    this.#ui = Tile.ui(coordinates, layout, parameters, configuration)

    this.center = this.#ui.center
    this.coordinates = coordinates
    this.group = this.#ui.group
    this.parameters = parameters

    // This needs to be last, since it references this
    this.items = (configuration.items || [])
      .map((configuration) => this.#itemFactory(this, configuration))
      .filter((item) => item !== undefined)
  }

  onClick (event) {
    this.items.forEach((item) => item.onClick(event))
  }

  onDeselected () {
    this.selected = false
    this.#ui.indicator.opacity = 0
    this.items.forEach((item) => item.onDeselected())
  }

  onSelected () {
    this.selected = true
    this.#ui.indicator.opacity = 0.15
    this.items.forEach((item) => item.onSelected())
  }

  #itemFactory (tile, configuration) {
    let item

    switch (configuration.type) {
      case Terminus.Type:
        item = new Terminus(tile, configuration)
        break
      case Reflector.Type:
        item = new Reflector(tile, configuration)
        break
      default:
        console.error('Ignoring item with unknown type: ' + configuration.type)
        break
    }

    return item
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

    const style = Object.assign(
      {},
      Tile.Styles.default,
      configuration.style || {}
    )

    const tile = new Path.RegularPolygon({
      center,
      closed: true,
      data,
      insert: false,
      radius: parameters.circumradius,
      sides: 6,
      style
    })

    const indicatorWidth = parameters.circumradius / 12

    const indicator = new Path.RegularPolygon({
      center,
      closed: true,
      insert: false,
      locked: true,
      opacity: 0,
      radius: parameters.circumradius - indicatorWidth - style.strokeWidth,
      sides: 6,
      strokeColor: 'black',
      strokeWidth: indicatorWidth
    })

    const group = new Group({
      children: [tile, indicator],
      // Allow this group to be clicked on
      locked: false
    })

    return { center, data, tile, indicator, group }
  }

  static Styles = Object.freeze({
    default: {
      fillColor: 'white',
      strokeColor: 'black',
      strokeWidth: 1
    },
    hover: {
      strokeColor: 'gray',
      strokeWidth: 2
    },
    selected: {
      strokeColor: 'blue',
      strokeWidth: 2
    }
  })

  static Type = 'Tile'
}
