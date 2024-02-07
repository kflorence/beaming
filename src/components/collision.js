import { StepState } from './step'

export class Collision {
  constructor (index, points, beam, item) {
    const items = [beam, item]

    this.beam = beam
    this.index = index

    // The item that was collided with
    this.item = item
    this.itemIds = items.map((item) => item.id)
    this.items = items

    // The first collision point
    this.point = points[0]
    this.points = points

    // Check if the collision is with self
    this.withSelf = beam.equals(item)
  }

  copy (settings) {
    return new Collision(
      settings.index ?? this.index,
      settings.points ?? this.points,
      settings.beam ?? this.beam,
      settings.item ?? this.item
    )
  }

  equals (other) {
    return other && other.point.equals(this.point) &&
      other.items.every((item) => this.has(item))
  }

  has (item) {
    return this.itemIds.includes(item.id)
  }

  mirror () {
    return this.copy({ beam: this.item, item: this.beam })
  }
}

export class CollisionMergeWith {
  constructor (beam, step, stepIndex) {
    this.beams = [beam].concat(step.state.get(StepState.MergeWith)?.beams || [])
    this.colors = step.colors.concat(beam.getColors())
    this.stepIndex = stepIndex
  }
}
