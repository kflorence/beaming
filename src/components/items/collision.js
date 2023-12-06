import { Item } from '../item'
import { Path } from 'paper'

export class Collision extends Item {
  constructor (configuration) {
    configuration.type = Item.Types.collision

    super(null, configuration)

    const { center, color } = configuration

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
