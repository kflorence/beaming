import { Group, Path, Point, Size } from 'paper'
import { Modifiable } from './modifiable'
import { Tile } from './tile'
import { Beam } from './beam'

export class Terminus extends Modifiable {
  constructor (tile, configuration) {
    super(configuration.modifiers || {})

    const ui = Terminus.ui(tile, configuration)

    this.activated = configuration.activated
    this.center = tile.center
    this.connections = {}
    this.openings = configuration.openings
    this.openings.forEach((opening) => this.connections[opening] = null)
    this.tile = tile
    this.ui = ui

    this.beams = this.openings.map((direction) => {
      return new Beam(this, { activated: this.activated, direction })
    })
  }

  connect (beam) {
    const opening = beam.endDirection

    if (this.activated) {
      throw new Error('Terminus is already activated')
    } else if (!this.connections.hasOwnProperty(opening)) {
      throw new Error('Terminus does not have opening: ' + opening)
    } else if (this.connections[opening] !== null) {
      throw new Error('Terminus is already connected at opening: ' + opening)
    }

    this.connections[opening] = beam

    // If all openings are connected the terminus can be activated
    if (Object.values(this.connections).every((opening) => opening !== null)) {
      this.toggle()
    }
  }

  disconnect (beam) {
    const opening = beam.endDirection

    if (!this.connections.hasOwnProperty(opening)) {
      throw new Error('Terminus does not have opening: ' + opening)
    }

    if (this.connections[opening] === null) {
      console.log('Terminus is already disconnected at opening: ' + opening)
    }

    this.connections[opening] = null

    if (this.activated) {
      this.toggle()
    }
  }

  onClick () {
    console.log(this.connections)

    // If this terminus has outside connections, activation is controlled by those
    if (Object.values(this.connections).some((beam) => beam && beam.activated)) {
      return
    }

    this.toggle()
    this.beams.forEach((beam) => beam.toggle())
  }

  toggle () {
    this.activated = !this.activated
    this.update()
  }

  update () {
    this.ui.hexagon.opacity = this.activated ? 1 : 0.5
  }

  static ui (tile, configuration) {
    const { color, openings } = configuration

    const parameters = Tile.parameters(tile.parameters.circumradius)
    const hexagon = new Path.RegularPolygon({
      center: tile.center,
      fillColor: color,
      opacity: 0.5,
      radius: parameters.circumradius,
      sides: 6
    })

    const cavity = new Path.Circle({
      center: tile.center,
      closed: true,
      fillColor: 'white',
      radius: parameters.circumradius / 2
    })

    const openingWidth = parameters.circumradius / 4

    const paths = openings.map((direction) => {
      const topLeft = tile.center.subtract(new Point(0, openingWidth / 2))
      const opening = new Path.Rectangle({
        fillColor: 'white',
        point: topLeft,
        size: new Size(parameters.inradius + 1, openingWidth)
      })

      opening.rotate(direction * 60, opening.bounds.leftCenter)

      return opening
    })

    const group = new Group({
      children: [hexagon, cavity].concat(paths),
      locked: true
    })

    return {
      color,
      hexagon,
      paths,
      parameters,
      cavity,
      openings,
      openingWidth,
      group
    }
  }
}
