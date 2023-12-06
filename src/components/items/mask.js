import { Item } from '../item'
import { Path } from 'paper'

export class Mask extends Item {
  constructor (tile, configuration = {}) {
    // Allow item to be clicked on
    configuration.locked = false
    configuration.type = Item.Types.mask

    super(null, configuration)

    const data = { type: this.type }
    const item = new Path.RegularPolygon({
      center: tile.center,
      closed: true,
      data,
      opacity: 0.25,
      radius: tile.parameters.circumradius + 1,
      sides: 6,
      style: Object.assign(
        { fillColor: 'black' },
        configuration?.style || {}
      )
    })

    this.center = tile.center
    this.group.addChild(item)
  }
}
