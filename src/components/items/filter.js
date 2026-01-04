import { Item } from '../item'
import { Color, Path } from 'paper'
import { movable } from '../modifiers/move'
import { getColorElement, merge } from '../util'
import { StepState } from '../step'
import { Schema } from '../schema'

export class Filter extends movable(Item) {
  constructor (tile, state) {
    state.type ??= Item.Types.Filter

    super(...arguments)

    this.color = state.color

    const fillColor = new Color(this.color)
    fillColor.alpha = 0.25

    // TODO: update to something else? prism?
    const item = new Path.RegularPolygon({
      center: tile.center,
      closed: true,
      radius: (state.height ?? tile.parameters.circumradius) / 3,
      sides: 3,
      style: {
        fillColor,
        strokeColor: this.color,
        strokeWidth: 2
      }
    })

    this.group.addChild(item)
  }

  getColorElements () {
    return [getColorElement(this.color)]
  }

  onCollision ({ currentStep, nextStep }) {
    // The beam will collide with the filter twice, on entry and exit, so ignore the first one, but track in state
    return nextStep.copy(
      currentStep.state.has(StepState.Filter)
        ? { colors: nextStep.colors.concat([this.color]) }
        : { state: new StepState({ insertAbove: this }, new StepState.Filter()) }
    )
  }

  static schema = () => Object.freeze(merge(Item.schema(Item.Types.Filter), {
    properties: {
      color: Schema.color
    },
    required: ['color']
  }))
}
