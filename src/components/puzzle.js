import { Layout } from './layout'
import paper, { Layer } from 'paper'
import { Events } from './util'
import { Item } from './item'
import { Mask } from './items/mask'
import { Modifier } from './modifier'

const elements = Object.freeze({
  connectionsRequired: document.getElementById('connections-required'),
  message: document.getElementById('message'),
  state: document.getElementById('state')
})

export class Puzzle {
  layers = {}
  selectedTile
  solved = false

  #mask
  #tiles

  constructor (id, { connections, layout, title }) {
    this.layout = new Layout(layout)

    this.#tiles = this.layout.tiles.flat().filter((tile) => tile)

    this.layers.mask = new Layer()

    this.id = id
    this.title = title

    elements.message.textContent = title

    this.#setState(connections)

    paper.view.onClick = (event) => this.#onClick(event)

    this.update()
  }

  #onClick (event) {
    let tile

    if (this.solved) {
      return
    }

    const hit = paper.project.hitTest(event.point)

    switch (hit?.item.data.type) {
      case Item.Types.mask:
        return
      case Item.Types.tile:
        tile = this.layout.getTile(hit.item.data.coordinates.axial)
        break
    }

    // There is an active mask
    if (this.#mask) {
      // An un-masked tile was clicked on
      if (tile && tile !== this.selectedTile) {
        switch (this.#mask.type) {
          case Events.ModifierSelected: {
            const modifier = this.#mask.detail.modifier
            modifier.remove()
            tile.addModifier(modifier.configuration)
            this.unmask()
            break
          }
        }
      } else {
        // Neither a tile nor mask was clicked on
        Modifier.deselect()
      }
    }

    if (!this.#mask) {
      const previouslySelectedTile = this.#updateSelectedTile(tile)

      if (tile && tile === previouslySelectedTile) {
        tile.onClick(event)
      }
    }
  }

  mask (event) {
    this.#mask = event
    // TODO animation?
    const mask = this.#tiles.filter(event.detail.filter).map((tile) => new Mask(tile, event.detail))
    this.layers.mask.addChildren(mask.map((mask) => mask.group))
  }

  unmask () {
    this.#mask = undefined
    this.layers.mask.removeChildren()
  }

  update (event) {
    // console.log('update', event)

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

  #onSolved () {
    this.solved = true

    if (this.selectedTile) {
      this.selectedTile.onDeselected()
      this.selectedTile = null
    }

    const event = new CustomEvent(Events.Solved)
    document.dispatchEvent(event)
  }

  #setState (connections) {
    connections.forEach((color) => {
      const span = document.createElement('span')
      span.classList.add('connection', 'material-symbols-outlined')
      span.textContent = Puzzle.States.disconnected
      span.style.backgroundColor = color
      span.title = `Connection: ${color}`
      elements.state.append(span)
    })
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

  static States = Object.freeze({
    connected: 'power',
    disconnected: 'power_off'
  })
}
