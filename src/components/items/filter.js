import chroma from 'chroma-js'
import { Item } from '../item'
import { Color, Group, Path } from 'paper'
import { Beam } from './beam'

export class Filter extends Item {
  type = Item.Types.filter

  constructor (tile, { color }) {
    super(tile)

    this.color = color

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

    this.group = new Group({
      children: [item],
      // Allow this group to be clicked on
      locked: false
    })
  }

  onCollision (beam, collision, currentStep, nextStep, collisionStep) {
    // The beam will collide with the filter twice, on entry and exit, so ignore the first one, but track in state
    return Beam.Step.from(
      nextStep,
      currentStep.state.filtered
        ? { color: chroma.average([nextStep.color, this.color]).hex() }
        : { state: { filtered: true, insertAbove: this.group.firstChild } }
    )
  }
}