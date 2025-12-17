import { CubeCoordinates } from './cube'
import { Schema } from '../schema.js'

export class OffsetCoordinates {
  constructor (r, c) {
    this.r = OffsetCoordinates.normalize(r)
    this.c = OffsetCoordinates.normalize(c)
    this.coordinates = [this.r, this.c]
  }

  add (offset) {
    return new OffsetCoordinates(this.r + offset.r, this.c + offset.c)
  }

  equals (other) {
    return other instanceof OffsetCoordinates && other.r === this.r && other.c === this.c
  }

  toString (separator = ',') {
    return this.coordinates.join(separator)
  }

  static normalize (coordinate) {
    // Get rid of signed zero
    return coordinate === 0 ? Math.abs(coordinate) : coordinate
  }

  static toAxialCoordinates (offset) {
    const q = offset.c - (offset.r - (offset.r & 1)) / 2
    return new CubeCoordinates(q, offset.r)
  }

  static Schema = Object.freeze({
    $id: Schema.$id('offset'),
    properties: {
      c: {
        title: 'column',
        type: 'number'
      },
      r: {
        title: 'row',
        type: 'number'
      }
    },
    required: ['c', 'r'],
    type: 'object'
  })
}
