import { Group, Path } from 'paper'
import { Item } from '../item'

export class Beam extends Item {
  constructor(terminus, opening) {
    super(...arguments)

    this.color = opening.color
    this.width = terminus.radius / 12

    const item = new Path({
      closed: false,
      insert: false,
      strokeColor: this.color,
      strokeJoin: 'round',
      strokeWidth: this.width
    })

    this.group = new Group({
      children: [item],
      locked: true
    })
  }
}
