import { Group, Path, Point, Size } from 'paper'
import { Item } from '../item'
import { rotatable } from '../modifiers/rotate'

export class Reflector extends rotatable(Item) {
  type = Item.Types.reflector

  #ui

  constructor (tile, configuration) {
    // noinspection JSCheckFunctionSignatures
    super(...arguments)

    this.#ui = Reflector.ui(tile, configuration)

    this.color = this.#ui.item.fillColor
    this.group = this.#ui.group
    this.rotateDirection = configuration.direction || 0

    this.doRotate(this.rotateDirection)
  }

  static ui (tile, { color }) {
    const length = tile.parameters.circumradius
    const width = tile.parameters.circumradius / 12
    const topLeft = tile.center.subtract(new Point(width / 2, length / 2))

    const item = new Path.Rectangle({
      fillColor: color || 'black',
      insert: false,
      point: topLeft,
      size: new Size(width, length)
    })

    const group = new Group({
      children: [item],
      locked: true
    })

    return { item, group }
  }
}
