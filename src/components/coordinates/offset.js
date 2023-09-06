import { CubeCoordinates } from './cube'

export class OffsetCoordinates {
  constructor (r, c) {
    this.coordinates = [r, c]
    this.r = r
    this.c = c
  }

  toString () {
    return this.coordinates.join(',')
  }

  static toAxialCoordinates (offset) {
    const q = offset.c - (offset.r - (offset.r & 1)) / 2
    return new CubeCoordinates(q, offset.r)
  }
}
