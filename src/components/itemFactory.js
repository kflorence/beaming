import { Filter } from './items/filter'
import { Portal } from './items/portal'
import { Terminus } from './items/terminus'
import { Reflector } from './items/reflector'
import { Wall } from './items/wall'
import { Item } from './item'

export function itemFactory (parent, state, index) {
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
      console.debug('itemFactory', state)
      throw new Error(`Cannot create item with unknown type: ${state.type}`)
  }

  if (item) {
    item.onInitialization()
  }

  return item
}
