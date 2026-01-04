import { Filter } from './items/filter'
import { Portal } from './items/portal'
import { Terminus } from './items/terminus'
import { Reflector } from './items/reflector'
import { Wall } from './items/wall'
import { Item } from './item'
import { Schema } from './schema'
import { ModifierItem } from './items/modifier.js'
import { Color, Path, Project, Size } from 'paper'
import { hexagon } from './util.js'
import { Modifier } from './modifier.js'

export class Items {
  static schema = () => Object.freeze({
    $id: Schema.$id('items'),
    items: {
      anyOf: [
        Filter.schema(),
        ModifierItem.schema(),
        Portal.schema(),
        Reflector.schema(),
        Terminus.schema(),
        Wall.schema()
      ],
      headerTemplate: 'item {{i1}}'
    },
    type: 'array'
  })

  static factory (parent, state, index) {
    const item = Items.#getItem(...arguments)

    item.onInitialization()

    return item
  }

  static #getItem (parent, state) {
    switch (state.type) {
      case Item.Types.Filter: {
        return new Filter(...arguments)
      }
      case Item.Types.Modifier: {
        return new ModifierItem(...arguments)
      }
      case Item.Types.Portal: {
        return new Portal(...arguments)
      }
      case Item.Types.Terminus: {
        return new Terminus(...arguments)
      }
      case Item.Types.Reflector: {
        return new Reflector(...arguments)
      }
      case Item.Types.Wall: {
        return new Wall(...arguments)
      }
      default: {
        console.debug('Items.factory', state)
        throw new Error(`Cannot create item with unknown type: ${state.type}`)
      }
    }
  }

  static svgSize = new Size(36, 36)

  static svgs (tile) {
    // Generate SVGs for every item for use in the documentation
    return Object.freeze({
      filter: new Filter(tile, { color: 'black', height: Items.svgSize.height }),
      'modifier-puzzle': new ModifierItem(tile, { modifier: { type: Modifier.Types.Puzzle } }),
      portal: new Portal(tile, { height: Items.svgSize.height }),
      'portal-directional': new Portal(tile, { direction: 1, height: Items.svgSize.height - 8 }),
      reflector: new Reflector(tile, { height: Items.svgSize.height }),
      terminus: new Terminus(tile, {
        color: 'black',
        height: Items.svgSize.height,
        openings: [
          {
            direction: 1
          }
        ]
      }),
      wall: new Wall(tile, { directions: [0, 1, 2, 3, 4, 5] })
    })
  }
}

const project = new Project(Items.svgSize)
const layer = project.activeLayer
const center = project.view.center
const parameters = hexagon(project.view.bounds.height)
const styles = {
  default: {
    dashArray: [],
    fillColor: new Color('white'),
    strokeColor: new Color('#666'),
    strokeWidth: 1
  }
}

const tile = {
  center,
  parameters,
  path: new Path.RegularPolygon({
    center,
    closed: true,
    radius: parameters.circumradius,
    sides: 6,
    style: styles.default
  }),
  styles
}

Object.entries(Items.svgs(tile)).forEach(([name, item]) => {
  const element = document.getElementById(`svg-${name}`)
  item.onInitialization()
  layer.addChild(item.group)
  element.append(project.exportSVG())
  layer.removeChildren()
})

project.remove()
