import { OffsetCoordinates } from './offset'
import { Point } from 'paper'
import { sqrt3 } from '../util'

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
    return new CubeCoordinates(this.q + other.q, this.r + other.r)
  }

  equals (other) {
    return this.q === other.q && this.r === other.r && this.s === other.s
  }

  isNeighbor (other) {
    return CubeCoordinates.isNeighbor(this, other)
  }

  neighbor (direction) {
    return CubeCoordinates.neighbor(this, direction)
  }

  toPoint (size) {
    const x = size * (sqrt3 * this.q + sqrt3 / 2 * this.r)
    const y = size * (3.0 / 2 * this.r)
    return new Point(x, y)
  }

  toString () {
    return this.coordinates.join(',')
  }

  static direction (direction) {
    if (direction === 0) direction = 6
    // PaperJS uses a clockwise system, but the axial system is counter-clockwise.
    // So we flip the direction here by subtracting it from six
    return CubeCoordinates.directions[6 - direction]
  }

  static directions = [
    new CubeCoordinates(1, 0),
    new CubeCoordinates(1, -1),
    new CubeCoordinates(0, -1),
    new CubeCoordinates(-1, 0),
    new CubeCoordinates(-1, 1),
    new CubeCoordinates(0, 1)
  ]

  static fromPoint (point, circumradius) {
    const q = (sqrt3 / 3 * point.x - 1.0 / 3 * point.y) / circumradius
    const r = (2.0 / 3 * point.y) / circumradius
    return CubeCoordinates.round(new CubeCoordinates(q, r))
  }

  static isNeighbor (a, b) {
    return CubeCoordinates.directions
      .map((direction) => CubeCoordinates.add(a, direction))
      .some((neighbor) => neighbor.equals(b))
  }

  static neighbor (start, direction) {
    return CubeCoordinates.add(start, CubeCoordinates.direction(direction))
  }

  static round (cube) {
    const q = Math.round(cube.q)
    const r = Math.round(cube.r)
    const s = Math.round(cube.s)

    const qDiff = Math.abs(q - cube.q)
    const rDiff = Math.abs(r - cube.r)
    const sDiff = Math.abs(s - cube.s)

    if (qDiff > rDiff && qDiff > sDiff) {
      return new CubeCoordinates(-r - s, r, s)
    } else if (rDiff > sDiff) {
      return new CubeCoordinates(q, -q - s, s)
    } else {
      return new CubeCoordinates(q, r, -q - r)
    }
  }

  static toOffsetCoordinates (axial) {
    const c = axial.q + (axial.r - (axial.r & 1)) / 2
    return new OffsetCoordinates(axial.r, c)
  }
}
