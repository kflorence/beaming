import { Layout } from './layout'
import paper, { Layer } from 'paper'
import { Events } from './util'
import { Item } from './item'
import { Mask } from './items/mask'
import { Modifier } from './modifier'
import { Beam } from './items/beam'

const elements = Object.freeze({
  connectionsRequired: document.getElementById('connections-required'),
  message: document.getElementById('message'),
  state: document.getElementById('state')
})

export class Puzzle {
  layers = {}
  selectedTile
  solved = false

  #beams = []
  #mask
  #tiles
  #termini

  constructor (id, { connections, layout, title }) {
    this.layout = new Layout(layout)

    this.#tiles = this.layout.tiles.flat().filter((tile) => tile)
    this.#termini = this.layout.items.filter((item) => item.type === Item.Types.terminus)

    this.layers.beams = new Layer()
    this.layers.mask = new Layer()

    this.id = id
    this.title = title

    elements.message.textContent = title

    this.#setState(connections)

    paper.view.onClick = (event) => this.#onClick(event)

    this.#createBeams()
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
      // An un-masked, not currently selected tile was clicked on
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

  unmask () {
    this.#mask = undefined
    this.layers.mask.removeChildren()
  }

  update (event) {
    switch (event?.type) {
      case Events.TileModified:
        this.#updateBeams(event.detail)
        break
    }

    this.#onUpdate()
  }

  #createBeams () {
    this.#termini.forEach((terminus) => {
      // Create beams for each terminus opening
      const beams = terminus.openings.filter((opening) => opening).map((opening) => new Beam(terminus, opening))

      this.#beams.push(...beams)
      this.layers.beams.addChildren(beams.map((beam) => beam.group))
    })
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

  #onUpdate() {
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

  #updateBeams (event) {
    // TODO
    // const modifier = event.modifier
    // const tile = modifier.tile
    //
    // switch (modifier.type) {
    //   case Modifier.Types.toggle:
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

  static States = Object.freeze({
    connected: 'power',
    disconnected: 'power_off'
  })
}
