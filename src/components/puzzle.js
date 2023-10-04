import { Layout } from './layout'
import paper, { Layer } from 'paper'
import { emitEvent } from './util'
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

  #beams
  #mask
  #tiles
  #termini

  constructor (id, { connections, layout, title }) {
    this.layout = new Layout(layout)

    this.#tiles = this.layout.tiles.flat().filter((tile) => tile)
    this.#termini = this.layout.items.filter((item) => item.type === Item.Types.terminus)
    this.#beams = this.#termini.flatMap((terminus) => terminus.beams)

    this.layers.mask = new Layer()
    this.layers.collisions = new Layer()

    this.id = id
    this.title = title

    elements.message.textContent = title

    this.#setState(connections)

    paper.view.onClick = (event) => {
      this.#onClick(event)
    }

    // Add layers in the order we want them
    [
      this.layout.layers.tiles,
      this.layout.layers.beams,
      this.layout.layers.items,
      this.layers.mask,
      this.layers.collisions,
      this.layout.layers.debug
    ].forEach((layer) => paper.project.addLayer(layer))

    this.#updateBeams(this.#beams.filter((beam) => beam.on))
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
      // An un-masked, not currently selected tile was clicked on
      if (tile && tile !== this.selectedTile) {
        switch (this.#mask.type) {
          case Modifier.Events.Selected: {
            const modifier = this.#mask.detail.modifier
            modifier.remove()
            tile.addModifier(modifier.configuration)
            this.unmask()
            break
          }
        }
      } else {
        // The user clicked on the currently selected tile, or outside the tiled area
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

  onBeamCollision (event) {

  }

  onBeamConnected (event) {

  }

  onModifierInvoked (event) {
    this.#beams.forEach((beam) => beam.onEvent(event))

    const activeBeams = this.#beams.filter((beam) => beam.isActive())
    if (activeBeams.length) {
      this.#updateBeams(activeBeams)
      this.#onUpdate()
    }
  }

  unmask () {
    this.#mask = undefined
    this.layers.mask.removeChildren()
  }

  #onSolved () {
    this.solved = true

    if (this.selectedTile) {
      this.selectedTile.onDeselected()
      this.selectedTile = null
    }

    emitEvent(Puzzle.Events.Solved)
  }

  #onUpdate () {
    // TODO: check for solutions
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

  #updateBeams (beams) {
    beams.forEach((beam) => beam.step(this.layout))

    const beamsToUpdate = beams.filter((beam) => beam.isActive())
    if (beamsToUpdate.length) {
      this.#updateBeams(beamsToUpdate)
    }
  }

  #updateSelectedTile (tile) {
    const previouslySelectedTile = this.selectedTile

    this.selectedTile = tile

    if (previouslySelectedTile && previouslySelectedTile !== tile) {
      previouslySelectedTile.onDeselected(tile)
    }

    if (tile && tile !== previouslySelectedTile) {
      tile.onSelected(previouslySelectedTile)
    }

    return previouslySelectedTile
  }

  static Events = Object.freeze({
    Solved: 'puzzle-solved'
  })

  static States = Object.freeze({
    connected: 'power',
    disconnected: 'power_off'
  })
}
