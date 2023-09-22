import { Group, Path } from 'paper'
import { Tile } from '../tile'
import { toggleable } from '../modifiers/toggle'
import { Item } from '../item'
import { rotatable } from '../modifiers/rotate'

export class Terminus extends rotatable(toggleable(Item)) {
  #connections
  #ui

  rotateDegrees = 60

  constructor (tile, { activated, color, openings, type, modifiers }) {
    // noinspection JSCheckFunctionSignatures
    super(...arguments)

    this.#connections = new Array(openings.length)
    this.#ui = Terminus.ui(tile, { color, openings })

    this.activated = activated
    this.color = color
    this.group = this.#ui.group
    this.openings = openings

    this.update()
  }

  connect (beam) {
    const opening = beam.endDirection

    if (this.activated) {
      throw new Error('Terminus is already activated')
    } else if (!this.openings.includes(opening)) {
      throw new Error('Terminus does not have opening: ' + opening)
    } else if (this.#connections[opening] !== null) {
      throw new Error('Terminus is already connected at opening: ' + opening)
    }

    this.#connections[opening] = beam

    // If all openings are connected the terminus can be activated
    if (Object.values(this.#connections).every((opening) => opening !== null)) {
      this.toggle()
    }
  }

  disconnect (beam) {
    const opening = beam.endDirection

    if (!this.openings.includes(opening)) {
      throw new Error('Terminus does not have opening: ' + opening)
    }

    if (this.#connections[opening] === null) {
      console.log('Terminus is already disconnected at opening: ' + opening)
    }

    this.#connections[opening] = null

    if (this.activated) {
      this.toggle()
    }
  }

  update () {
    this.#ui.item.fillColor.alpha = this.activated ? 1 : 0.5
  }

  static ui (tile, { color, openings }) {
    const parameters = Tile.parameters(tile.parameters.circumradius)
    const hexagon = new Path.RegularPolygon({
      center: tile.center,
      fillColor: color,
      insert: false,
      radius: parameters.circumradius,
      sides: 6,
      strokeWidth: 1,
      strokeColor: color
    })

    const cavity = new Path.RegularPolygon({
      insert: false,
      center: tile.center,
      radius: parameters.circumradius / 2,
      sides: 6
    })

    const paths = openings.map((opening) => {
      const directionFrom = opening.direction
      const directionTo = directionFrom === 5 ? 0 : directionFrom + 1

      return new Path({
        closed: true,
        insert: false,
        segments: [
          tile.center,
          hexagon.segments[directionFrom].point,
          hexagon.segments[directionTo].point
        ]
      })
    })

    // Create the final shape
    const item = paths.reduce(
      (shape, path) => shape.subtract(path, { insert: false }),
      hexagon.exclude(cavity, { insert: false })
    )

    const group = new Group({
      children: [item],
      locked: true
    })

    return { item, group }
  }

  static Type = 'Terminus'
}
