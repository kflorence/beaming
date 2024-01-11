import { deepEqual, uniqueBy } from './util'

export class Collision {
  constructor (points, item) {
    this.item = item
    this.point = points[0]
    this.points = points
  }

  equals (other) {
    return deepEqual(this, other)
  }
}

export class CollisionLoop {
  #cache

  constructor (...beams) {
    // Pull in any other beams that are involved
    this.beams = uniqueBy(
      beams.flatMap((beam) => {
        const collisions = this.#cache[beam.id] = beam.getCollisions()
        return Object.values(collisions)
      }).map((collision) => collision.item),
      'id'
    )
    this.collisions = this.beams.map((beam) => this.#cache[beam.id] ?? (this.#cache[beam.id] = beam.getCollisions()))
  }

  getCollisions (beam) {
    return this.#cache[beam.id]
  }

  getCollisionStepIndexes (beam) {
    return Object.keys(this.getCollisions(beam)).map(Number).sort((a, b) => a - b)
  }
}
