import { Filter } from './items/filter'
import { Portal } from './items/portal'
import { Terminus } from './items/terminus'
import { Reflector } from './items/reflector'
import { Wall } from './items/wall'
import { Item } from './item'
import { Schema } from './schema'

export class Items {
  static Schema = Object.freeze({
    $id: Schema.$id('items'),
    items: {
      anyOf: [
        Filter.Schema,
        Portal.Schema,
        Reflector.Schema,
        Terminus.Schema,
        Wall.Schema
      ]
    },
    type: 'array'
  })

  static factory (parent, state, index) {
    let item

    switch (state.type) {
      case Item.Types.filter:
        item = new Filter(...arguments)
        break
      case Item.Types.portal:
        item = new Portal(...arguments)
        break
      case Item.Types.terminus:
        item = new Terminus(...arguments)
        break
      case Item.Types.reflector:
        item = new Reflector(...arguments)
        break
      case Item.Types.wall:
        item = new Wall(...arguments)
        break
      default:
        console.debug('Items.factory', state)
        throw new Error(`Cannot create item with unknown type: ${state.type}`)
    }

    if (item) {
      item.onInitialization()
    }

    return item
  }
}
