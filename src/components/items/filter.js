import chroma from 'chroma-js'
import { Item } from '../item'
import { Color, Path } from 'paper'
import { Beam } from './beam'
import { movable } from '../modifiers/move'
import { colorElement } from '../util'

export class Filter extends movable(Item) {
  constructor (tile, { color }) {
    super(...arguments)

    this.color = chroma(color).hex()

    const fillColor = new Color(color)
    fillColor.alpha = 0.25

    // TODO: update to something else? prism?
    const item = new Path.RegularPolygon({
      center: tile.center,
      closed: true,
      radius: tile.parameters.circumradius / 3,
      sides: 3,
      style: {
        fillColor,
        strokeColor: color,
        strokeWidth: 2
      }
    })

    this.group.addChild(item)
  }

  getColorElements () {
    return [colorElement(this.color)]
  }

  onCollision (beam, puzzle, collision, collisionIndex, collisions, currentStep, nextStep) {
    // The beam will collide with the filter twice, on entry and exit, so ignore the first one, but track in state
    return Beam.Step.from(
      nextStep,
      currentStep.state.filtered
        ? { color: chroma.average([nextStep.color, this.color]).hex() }
        : { state: { filtered: true, insertAbove: this } }
    )
  }
}
