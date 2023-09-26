import chroma from 'chroma-js'
import { Group, Path, Point, Size } from 'paper'
import { toggleable } from '../modifiers/toggle'
import { Item } from '../item'
import { rotatable } from '../modifiers/rotate'

export class Terminus extends rotatable(toggleable(Item)) {
  #connections
  #ui

  rotateDegrees = 60

  constructor (tile, { color, openings, type, modifiers }) {
    // noinspection JSCheckFunctionSignatures
    super(...arguments)

    if (color === undefined) {
      const colors = openings.filter((opening) => opening.color).map((opening) => opening.color)

      if (colors.length === 0) {
        throw new Error('Terminus has no color defined.')
      }

      color = chroma.average(colors).hex()
    }

    this.#connections = new Array(openings.length)
    this.#ui = Terminus.ui(tile, { color, openings })

    this.color = color
    this.group = this.#ui.group
    this.openings = openings

    this.update()
  }

  update () {
    this.#ui.indicator.fillColor = this.toggled ? this.color : undefined
  }

  static ui (tile, { color, openings }) {
    const radius = tile.parameters.circumradius / 2

    const indicator = new Path.RegularPolygon({
      insert: false,
      center: tile.center,
      radius: radius,
      sides: 6
    })

    const hexagon = new Path.RegularPolygon({
      fillColor: color,
      insert: false,
      center: tile.center,
      sides: 6,
      radius: radius - (radius / 3)
    })

    const pathWidth = radius / 12
    const pathWidthPoint = new Point(pathWidth, 0)
    const pathHeight = tile.parameters.inradius / 2
    const pathHeightPoint = new Point(0, pathHeight)
    const pathBottomLeft = tile.center.subtract(pathWidthPoint)
    const pathBottomRight = tile.center.add(pathWidthPoint)

    const paths = openings.map((opening) => {
      const path = new Path({
        closed: true,
        data: opening,
        fillColor: opening.color || color,
        insert: false,
        segments: [
          pathBottomRight.subtract(new Point(0, pathHeight / 4)),
          pathBottomLeft.subtract(new Point(0, pathHeight / 4)),
          pathBottomLeft.subtract(pathHeightPoint),
          pathBottomRight.subtract(pathHeightPoint)
        ]
      })

      // The path is drawn at the 12 o'clock position, so in order to make the directions align correctly we have to
      // start by subtracting 30 degrees, since 0 = the 11 o'clock position.
      path.rotate(-30 + (opening.direction * 60), tile.center)

      return path
    })

    const terminus = paths.reduce(
      (shape, path) => path.data.beam ? shape : shape.subtract(path, {insert: false}),
      hexagon
    )

    const group = new Group({
      children: [indicator, ...paths.filter((item) => item.data.beam === true), terminus],
      locked: true
    })

    return { group, indicator, paths, terminus }
  }

  static Type = 'Terminus'
}
