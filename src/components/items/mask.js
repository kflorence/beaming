import { Item } from '../item'
import { Path } from 'paper'

export class Mask extends Item {
  constructor (tile, state) {
    super(null, state, { locked: false, type: Item.Types.mask })

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
        state?.style || {}
      )
    })

    this.center = tile.center
    this.group.addChild(item)
  }
}
