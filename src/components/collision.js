import { StepState } from './step'

export class Collision {
  constructor (index, points, items) {
    this.index = index

    // The item that was collided with
    this.item = items[1]
    this.itemIds = items.map((item) => item.id)
    this.items = items

    // The first collision point
    this.point = points[0]
    this.points = points
  }

  equals (other) {
    return other && other.point.equals(this.point) &&
      other.items.length === this.items.length &&
      other.items.every((item) => this.has(item))
  }

  has (beam) {
    return this.itemIds.includes(beam.id)
  }
}

export class CollisionMergeWith {
  constructor (beam, step, stepIndex) {
    this.beams = [beam].concat(step.state.get(StepState.MergeWith)?.beams || [])
    this.colors = step.colors.concat(beam.getColors())
    this.stepIndex = stepIndex
  }
}
