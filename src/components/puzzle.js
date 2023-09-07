import { Beam } from './beam'
import { CubeCoordinates } from './coordinates/cube'
import { Layout } from './layout'
import { OffsetCoordinates } from './coordinates/offset'
import paper, { Path } from 'paper'
import { Reflector } from './reflector'
import { Terminus } from './terminus'

export class Puzzle {
  constructor (configuration) {
    const reflectors = configuration.objects.reflectors || []

    this.configuration = configuration
    this.tileSize = configuration.layout.tileSize
    this.layout = new Layout(configuration.layout)
    this.solved = false

    this.reflectors = []
    for (let i = 0; i < reflectors.length; i++) {
      const reflectorConfiguration = reflectors[i]
      const tile = this.layout.getTileByOffset(
        new OffsetCoordinates(...reflectorConfiguration.offsetCoordinates)
      )
      const reflector = new Reflector(tile, reflectorConfiguration)
      tile.objects.reflector = reflector
      this.reflectors.push(reflector)
    }

    this.beams = []
    this.termini = []
    for (let i = 0; i < configuration.objects.termini.length; i++) {
      const terminusConfiguration = configuration.objects.termini[i]
      const tile = this.layout.getTileByOffset(
        new OffsetCoordinates(...terminusConfiguration.offsetCoordinates)
      )
      const terminus = new Terminus(tile, terminusConfiguration)
      tile.objects.terminus = terminus
      this.termini.push(terminus)
      const beams = terminus.openings.map((direction) => {
        return new Beam(terminus, { activated: terminus.activated, direction })
      })
      tile.objects.beams.push(...beams)
      this.beams.push(...beams)
    }

    this.beams.forEach((beam) => beam.group.bringToFront())
    this.reflectors.forEach((reflector) => reflector.group.bringToFront())

    this.selectedTile = null

    paper.view.onClick = (event) => this.onClick(event)
    paper.view.onMouseMove = (event) => this.onMouseMove(event)
  }

  getTile (event) {
    let tile
    const hit = paper.project.hitTest(event.point)
    if (hit && hit.item.data.type === 'tile') {
      const [q, r] = hit.item.data.axialId.split(',')
      tile = this.layout.getTileByAxial(new CubeCoordinates(q, r))
    }

    return tile
  }

  onClick (event) {
    if (this.solved) {
      return
    }

    const tile = this.getTile(event)

    if (tile) {
      if (tile.objects.reflector) {
        tile.objects.reflector.onClick(event)
      }

      if (tile.objects.terminus) {
        // Toggle each beam which originates at this terminus
        tile.objects.beams
          .filter((beam) => beam.startTerminus === tile.objects.terminus)
          .forEach((beam) => beam.toggle(event))
      }
    }

    this.update()
  }

  onMouseMove (event) {
    if (this.solved) {
      return
    }

    const tile = this.getTile(event)

    if (tile) {
      if (this.selectedTile !== tile) {
        if (this.selectedTile) {
          this.selectedTile.onUnselected(event)
        }
        this.selectedTile = tile
        this.selectedTile.onSelected(event)
      }
    } else if (this.selectedTile) {
      this.selectedTile.onUnselected(event)
      this.selectedTile = null
    }
  }

  onSolved (beams) {
    this.solved = true

    if (this.selectedTile) {
      this.selectedTile.onUnselected(null)
      this.selectedTile = null
    }

    const event = new CustomEvent('puzzle-solved')
    document.dispatchEvent(event)

    // TODO add 'fade-in' animation
    // Loop through each connected beam and draw a mask over each tile
    beams.forEach((beam) => beam.segments.forEach((segment) => {
      const style = Object.assign(
        {},
        segment.tile.style,
        {
          fillColor: beam.color
        }
      )
      // eslint-disable-next-line no-new
      new Path.RegularPolygon({
        center: segment.tile.center,
        closed: true,
        opacity: 0.25,
        radius: segment.tile.parameters.circumradius + 1,
        sides: 6,
        style
      })
    }))

    console.log('puzzle solved')
  }

  update () {
    this.beams.forEach((beam) => beam.update())

    // Check for solution.
    const connections = this.beams.filter((beam) => beam.activated && beam.endTerminus)
    if (this.configuration.connections === connections.length) {
      this.onSolved(connections)
    }
  }
}
