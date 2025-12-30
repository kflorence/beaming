import { Filter } from './items/filter'
import { Portal } from './items/portal'
import { Terminus } from './items/terminus'
import { Reflector } from './items/reflector'
import { Wall } from './items/wall'
import { Item } from './item'
import { Schema } from './schema'
import { ModifierItem } from './items/modifier.js'

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
}
