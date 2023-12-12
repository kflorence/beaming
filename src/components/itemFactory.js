import { Filter } from './items/filter'
import { Portal } from './items/portal'
import { Terminus } from './items/terminus'
import { Reflector } from './items/reflector'
import { Wall } from './items/wall'
import { Item } from './item'

export function itemFactory (parent, configuration) {
  let item

  switch (configuration.type) {
    case Item.Types.filter:
      item = new Filter(parent, configuration)
      break
    case Item.Types.portal:
      item = new Portal(parent, configuration)
      break
    case Item.Types.terminus:
      item = new Terminus(parent, configuration)
      break
    case Item.Types.reflector:
      item = new Reflector(parent, configuration)
      break
    case Item.Types.wall:
      item = new Wall(parent, configuration)
      break
    default:
      console.error('Ignoring item with unknown type: ' + configuration.type)
      break
  }

  if (item) {
    item.onInitialization()
  }

  return item
}
