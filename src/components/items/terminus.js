import chroma from 'chroma-js'
import { Color, Group, Path } from 'paper'
import { toggleable } from '../modifiers/toggle'
import { Item } from '../item'
import { rotatable } from '../modifiers/rotate'
import { Wall } from './wall'

export class Terminus extends rotatable(toggleable(Item)) {
  #connections
  #ui

  rotateDegrees = 60

  constructor (tile, { activated, color, openings, type, modifiers }) {
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
    this.#ui.item.fillColor.alpha = this.activated ? 0.5 : 0.25
  }

  static radius (tile) {
    return tile.parameters.circumradius - (tile.parameters.circumradius / 6)
  }

  static ui (tile, { color, openings }) {
    const radius = Terminus.radius(tile)
    const item = Wall.item(tile.center, radius, radius / 2, openings.map((opening) => opening.direction))

    item.fillColor = new Color(color)

    // TODO: handle 'contains'
    const center = new Path.RegularPolygon({
      fillColor: color,
      insert: false,
      center: tile.center,
      radius: radius / 3,
      sides: 6
    })

    const group = new Group({
      children: [item, center],
      locked: true
    })

    return { item, group }
  }

  static Type = 'Terminus'
}
