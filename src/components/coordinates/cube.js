import { OffsetCoordinates } from './offset'

/**
 * @see https://www.redblobgames.com/grids/hexagons/#coordinates
 */
export class CubeCoordinates {
  constructor (q, r, s) {
    if (!s) s = -q - r
    this.coordinates = [q, r, s]
    this.q = q
    this.r = r
    this.s = s
  }

  add (other) {
    return CubeCoordinates.add(this, other)
  }

  neighbor (direction) {
    return CubeCoordinates.neighbor(this, direction)
  }

  toString () {
    return this.coordinates.join(',')
  }

  static add (a, b) {
    return new CubeCoordinates(a.q + b.q, a.r + b.r)
  }

  static direction (direction) {
    if (direction === 0) direction = 6
    // PaperJS uses a clockwise system, but the axial system is counter-clockwise.
    // So we flip the direction here by subtracting it from six
    return CubeCoordinates.directions[6 - direction]
  };

  static directions = [
    new CubeCoordinates(1, 0),
    new CubeCoordinates(1, -1),
    new CubeCoordinates(0, -1),
    new CubeCoordinates(-1, 0),
    new CubeCoordinates(-1, 1),
    new CubeCoordinates(0, 1)
  ]

  static neighbor (start, direction) {
    return CubeCoordinates.add(start, CubeCoordinates.direction(direction))
  }

  static toOffsetCoordinates (axial) {
    const c = axial.q + (axial.r - (axial.r & 1)) / 2
    return new OffsetCoordinates(c, axial.r)
  }
}
