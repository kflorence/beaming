import { Item } from '../item'
import { Path } from 'paper'

export class Collision extends Item {
  constructor (state) {
    super(null, state, { type: Item.Types.Collision })

    const { center, color } = state

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

    this.group.addChild(item)
  }
}
