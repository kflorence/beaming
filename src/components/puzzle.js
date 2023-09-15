import { CubeCoordinates } from './coordinates/cube'
import { Layout } from './layout'
import { OffsetCoordinates } from './coordinates/offset'
import paper, { Layer, Path } from 'paper'
import { Terminus } from './items/terminus'
import { Events, Types } from './util'

export class Puzzle {
  constructor ({ connections, layout, items }) {
    this.tileSize = layout.tileSize

    this.selectedTile = undefined
    this.solved = false

    this.layout = new Layout(layout)

    this.items = new Layer()
    this.layers = [this.layout.layer, this.items]

    items.forEach((configuration) => {
      const tile = this.layout.getTileByOffset(new OffsetCoordinates(...configuration.offsetCoordinates))
      const item = this.#itemFactory(tile, configuration)
      this.items.addChild(item.group)
    })

    this.layers.concat(this.items)

    // TODO:
    // Beams will now be controlled entirely in the puzzle layer, so this will all need to be refactored.
    // The general logic will be to add and remove beams as they are turned on/off.
    // Any active beams will be looped through and updated individually.
    //
    // this.beams = this.termini.flatMap((terminus) => terminus.beams)
    //
    // this.reflectors = (configuration.objects.reflectors || []).map((configuration) => {
    //   const tile = this.layout.getTileByOffset(new OffsetCoordinates(...configuration.offsetCoordinates))
    //   const reflector = new Reflector(tile, configuration)
    //   tile.objects.reflector = reflector
    //   return reflector
    // })

    paper.view.onClick = (event) => this.onClick(event)

    this.update()
  }

  #itemFactory (tile, configuration) {
    let item

    switch (configuration.type) {
      case Types.Terminus:
        item = new Terminus(tile, configuration)
        break
      default:
        console.error('Ignoring item with unknown type: ' + configuration.type)
        break
    }

    return item
  }

  getTile (event) {
    let tile
    const hit = paper.project.hitTest(event.point)
    if (hit && hit.item.data.type === Types.Tile) {
      const [q, r] = hit.item.data.axialId.split(',')
      tile = this.layout.getTileByAxial(new CubeCoordinates(q, r))
    }

    return tile
  }

  selectTile (tile) {
    const previouslySelectedTile = this.selectedTile

    this.selectedTile = tile

    if (previouslySelectedTile && previouslySelectedTile !== tile) {
      previouslySelectedTile.onUnselected()
    }

    if (tile && tile !== previouslySelectedTile) {
      tile.onSelected()
    }

    const event = new CustomEvent(Events.TileSelected, { detail: { tile } })
    document.dispatchEvent(event)
  }

  onClick (event) {
    if (this.solved) {
      return
    }

    const tile = this.getTile(event)

    // if (tile === this.selectedTile) {
    //   if (tile.objects.reflector) {
    //     tile.objects.reflector.onClick(event)
    //   }
    //
    //   if (tile.objects.terminus) {
    //     tile.objects.terminus.onClick(event)
    //   }
    // }

    this.selectTile(tile)

    this.update()
  }

  onSolved (connections) {
    this.solved = true

    if (this.selectedTile) {
      this.selectedTile.onUnselected(null)
      this.selectedTile = null
    }

    const event = new CustomEvent(Events.Solved)
    document.dispatchEvent(event)

    const mask = {}

    // TODO add 'fade-in' animation
    // Loop through each connected beam and draw a mask over each tile
    connections.forEach((beam) => beam.segments.forEach((segment) => {
      const id = segment.tile.data.offsetId

      // Don't add multiple masks when beams overlap (e.g. for a terminus with multiple beams)
      if (mask[id]) {
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
    // this.beams.forEach((beam) => beam.update())
    // this.termini.forEach((terminus) => terminus.update())
    //
    // // Check for solution
    // const connections = this.beams.filter((beam) => beam.activated && beam.endTerminus)
    // if (this.configuration.connections === connections.length) {
    //   this.onSolved(connections)
    // }
  }
}
