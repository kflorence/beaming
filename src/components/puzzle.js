import { CubeCoordinates } from './coordinates/cube'
import { Layout } from './layout'
import { OffsetCoordinates } from './coordinates/offset'
import paper, { Path } from 'paper'
import { Reflector } from './reflector'
import { Terminus } from './terminus'

export class Puzzle {
  constructor (configuration) {
    this.configuration = configuration
    this.tileSize = configuration.layout.tileSize

    this.selectedTile = null
    this.solved = false

    this.layout = new Layout(configuration.layout)

    this.termini = configuration.objects.termini.map((configuration) => {
      const tile = this.layout.getTileByOffset(new OffsetCoordinates(...configuration.offsetCoordinates))
      const terminus = new Terminus(tile, configuration)
      tile.objects.terminus = terminus
      return terminus
    })

    this.beams = this.termini.flatMap((terminus) => terminus.beams)

    this.reflectors = (configuration.objects.reflectors || []).map((configuration) => {
      const tile = this.layout.getTileByOffset(new OffsetCoordinates(...configuration.offsetCoordinates))
      const reflector = new Reflector(tile, configuration)
      tile.objects.reflector = reflector
      return reflector
    })

    // Order of operations here is important as it controls the stacking order of items in the Paper project
    this.beams.forEach((beam) => beam.group.bringToFront())
    this.reflectors.forEach((reflector) => reflector.group.bringToFront())

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
        tile.objects.terminus.onClick()
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

  onSolved (connections) {
    this.solved = true

    if (this.selectedTile) {
      this.selectedTile.onUnselected(null)
      this.selectedTile = null
    }

    const event = new CustomEvent('puzzle-solved')
    document.dispatchEvent(event)

    let mask = {}

    // TODO add 'fade-in' animation
    // Loop through each connected beam and draw a mask over each tile
    connections.forEach((beam) => beam.segments.forEach((segment) => {
      const id = segment.tile.data.offsetId

      // Don't add multiple masks when beams overlap (e.g. for a terminus with multiple beams)
      if (mask.hasOwnProperty(id)) {
        return
      }

      const style = Object.assign(
        {},
        segment.tile.style,
        {
          fillColor: beam.color
        }
      )

      mask[id] = new Path.RegularPolygon({
        center: segment.tile.center,
        closed: true,
        opacity: 0.25,
        radius: segment.tile.parameters.circumradius + 1,
        sides: 6,
        style
      })
    }))
  }

  update () {
    this.beams.forEach((beam) => beam.update())
    this.termini.forEach((terminus) => terminus.update())

    // Check for solution
    const connections = this.beams.filter((beam) => beam.activated && beam.endTerminus)
    if (this.configuration.connections === connections.length) {
      this.onSolved(connections)
    }
  }
}
