import { Item } from '../item'
import { Group, Path } from 'paper'

export class Mask extends Item {
  type = Item.Types.mask

  constructor (tile, configuration) {
    super(null)

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
    this.group = new Group({
      children: [item],
      // Allow this group to be clicked on
      locked: false
    })
  }
}
