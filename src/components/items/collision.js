import { Item } from '../item'
import { Group, Path } from 'paper'

export class Collision extends Item {
  type = Item.Types.collision

  constructor ({ center, color }) {
    super(null)

    this.center = center
    this.color = color

    const item = new Path.Circle({
      center,
      closed: true,
      radius: 4,
      style: {
        fillColor: 'white',
        strokeColor: color,
        strokeWidth: 2
      }
    })

    this.group = new Group({
      children: [item],
      data: { id: this.id, type: this.type },
      locked: true
    })
  }
}
