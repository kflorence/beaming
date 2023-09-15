import { Group, Path } from 'paper'
import { Tile } from '../tile'
import { Item } from '../item'

export class Terminus extends Item {
  #connections
  #ui

  constructor (tile, { activated, color, openings, type, modifiers }) {
    super(tile, { type, modifiers })

    this.#connections = {}
    openings.forEach((opening) => {
      this.#connections[opening] = null
    })

    this.#ui = Terminus.ui(tile, { color, openings })

    this.activated = activated
    this.color = color
    this.group = this.#ui.group
    this.openings = openings
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

  onClick (event) {
    super.onClick(event)

    // If this terminus has outside connections, activation is controlled by those
    if (Object.values(this.#connections).some((beam) => beam && beam.activated)) {
      return
    }

    this.toggle()
  }

  toggle () {
    this.activated = !this.activated
    this.update()
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

    hexagon.fillColor.alpha = 0.5

    const cavity = new Path.RegularPolygon({
      insert: false,
      center: tile.center,
      radius: parameters.circumradius / 2,
      sides: 6
    })

    const paths = openings.map((direction) => {
      return new Path({
        closed: true,
        insert: false,
        segments: [
          tile.center,
          hexagon.segments[direction].point,
          hexagon.segments[direction === 5 ? 0 : direction + 1].point
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
}
