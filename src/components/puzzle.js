import { Layout } from './layout'
import paper, { Path } from 'paper'
import { Events } from './util'
import { Tile } from './tile'

const elements = Object.freeze({
  connectionsRequired: document.getElementById('connections-required'),
  message: document.getElementById('message')
})

export class Puzzle {
  selectedTile
  solved = false

  constructor (id, { connectionsRequired, layout, title }) {
    this.layout = new Layout(layout)

    this.id = id
    this.title = title

    elements.message.textContent = title
    elements.connectionsRequired.textContent = connectionsRequired || '?'

    paper.view.onClick = (event) => this.#onClick(event)

    this.#update()
  }

  #getTile (event) {
    let tile
    const hit = paper.project.hitTest(event.point)
    if (hit && hit.item.data.type === Tile.Type) {
      tile = this.layout.getTile(hit.item.data.coordinates.axial)
    }

    return tile
  }

  #onClick (event) {
    if (this.solved) {
      return
    }

    const tile = this.#getTile(event)
    const previouslySelectedTile = this.#updateSelectedTile(tile)

    if (tile && tile === previouslySelectedTile) {
      tile.onClick(event)
    }

    this.#update()
  }

  #onSolved (connections) {
    this.solved = true

    if (this.selectedTile) {
      this.selectedTile.onDeselected()
      this.selectedTile = null
    }

    const event = new CustomEvent(Events.Solved)
    document.dispatchEvent(event)

    const mask = {}

    // TODO add 'fade-in' animation
    // Loop through each connected beam and draw a mask over each tile
    connections.forEach((beam) => beam.segments.forEach((segment) => {
      const id = segment.tile.data.coordinates.offset.toString()

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

  #update () {
    // TODO: update beams
    // The general logic will be to add and remove beams as they are turned on/off.
    // Any active beams will be looped through and updated individually.

    // this.beams.forEach((beam) => beam.update())
    // this.termini.forEach((terminus) => terminus.update())
    //
    // // Check for solution
    // const connections = this.beams.filter((beam) => beam.activated && beam.endTerminus)
    // if (this.configuration.connections === connections.length) {
    //   this.onSolved(connections)
    // }
  }

  #updateSelectedTile (tile) {
    const previouslySelectedTile = this.selectedTile

    this.selectedTile = tile

    if (previouslySelectedTile && previouslySelectedTile !== tile) {
      previouslySelectedTile.onDeselected()
    }

    if (tile && tile !== previouslySelectedTile) {
      tile.onSelected()
    }

    document.dispatchEvent(new CustomEvent(Events.TileSelected, {
      detail: { selected: tile, deselected: previouslySelectedTile }
    }))

    return previouslySelectedTile
  }
}
