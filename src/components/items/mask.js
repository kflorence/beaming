import { Item } from '../item'
import { Path } from 'paper'

export class Mask extends Item {
  constructor (tile, style) {
    super(null, style, { locked: false, type: Item.Types.Mask })

    const data = { type: this.type }
    const item = new Path.RegularPolygon({
      center: tile.center,
      closed: true,
      data,
      opacity: 0.25,
      radius: tile.parameters.circumradius + 1,
      sides: 6,
      style: Object.assign({ fillColor: 'black' }, style)
    })

    this.center = tile.center
    this.group.addChild(item)
  }
}
