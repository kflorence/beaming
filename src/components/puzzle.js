import { Layout } from './layout'
import chroma from 'chroma-js'
import paper, { Layer, Path } from 'paper'
import { capitalize, emitEvent } from './util'
import { Item } from './item'
import { Mask } from './items/mask'
import { Modifier } from './modifier'
import { Beam } from './items/beam'
import { Terminus } from './items/terminus'

const elements = Object.freeze({
  message: document.getElementById('message'),
  state: document.getElementById('state')
})

export class Puzzle {
  debug = false
  debugData = {}
  layers = {}
  selectedTile
  solved = false

  #beams = []
  #collisions
  #eventListeners = {}
  #maskEvent
  #tiles = []
  #termini = []

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

    this.connections = connections.map((color) => ({ color: chroma(color).hex(), connected: false }))

    this.#setState(this.connections)

    this.#addEventListeners()
    this.#addLayers()

    this.#updateBeams(this.#beams.filter((beam) => beam.isActive()))
  }

  drawDebugPoint (point) {
    const circle = new Path.Circle({
      radius: 3,
      fillColor: 'white',
      strokeColor: 'black',
      strokeWidth: 1,
      center: point
    })
    this.layout.layers.debug.addChild(circle)
  }

  mask (event) {
    this.#maskEvent = event

    // TODO animation?
    const mask = this.#tiles.filter(event.detail.filter)
      .map((tile) => new Mask(
        tile,
        typeof event.detail.configurator === 'function' ? event.detail.configurator(tile) : event.detail
      ))
    this.layers.mask.addChildren(mask.map((mask) => mask.group))
  }

  teardown () {
    document.body.classList.remove(...Object.values(Puzzle.Events))
    this.#tiles.map((tile) => tile.teardown())
    this.#removeEventListeners()
    this.#removeLayers()
  }

  unmask () {
    this.#maskEvent = undefined
    this.layers.mask.removeChildren()
  }

  #addEventListeners () {
    paper.view.onClick = (event) => this.#onClick(event)

    Object.entries({
      keyup: this.#onKeyup,
      [Beam.Events.Collision]: this.#onBeamCollision,
      [Beam.Events.OutOfBounds]: this.#onBeamCollision,
      [Modifier.Events.Deselected]: this.unmask,
      [Modifier.Events.Invoked]: this.#onModifierInvoked,
      [Modifier.Events.Selected]: this.mask,
      [Puzzle.Events.Solved]: this.mask,
      [Terminus.Events.Connection]: this.#onTerminusConnection,
      [Terminus.Events.Disconnection]: this.#onTerminusDisconnection
    }).forEach(([name, handler]) => {
      // Ensure proper 'this' context inside of event handlers
      handler = handler.bind(this)
      this.#eventListeners[name] = handler
      document.addEventListener(name, handler)
    })
  }

  #addLayers () {
    // Add layers in the order we want them
    [
      this.layout.layers.tiles,
      this.layout.layers.beams,
      this.layout.layers.items,
      this.layers.mask,
      this.layers.collisions,
      this.layout.layers.debug
    ].forEach((layer) => paper.project.addLayer(layer))
  }

  #onBeamCollision (event) {
    // console.log('collision', event)
  }

  #onBeamOutOfBounds (event) {
    this.#onBeamCollision(event)
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
    if (this.#maskEvent) {
      // An un-masked, not currently selected tile was clicked on
      if (tile && tile !== this.selectedTile) {
        switch (this.#maskEvent.type) {
          case Modifier.Events.Selected: {
            const modifier = this.#maskEvent.detail.modifier
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

    if (!this.#maskEvent) {
      const previouslySelectedTile = this.#updateSelectedTile(tile)

      if (tile && tile === previouslySelectedTile) {
        tile.onClick(event)
      }
    }
  }

  #onKeyup (event) {
    if (this.debug && this.debugData.beamsToUpdate?.length && event.key === 's') {
      this.#updateBeams(this.debugData.beamsToUpdate)
    }
  }

  #onModifierInvoked (event) {
    this.#beams.forEach((beam) => beam.onModifierInvoked(event))

    const activeBeams = this.#beams.filter((beam) => beam.isActive())
    const tile = event.detail.tile

    if (tile) {
      // Give precedence to beams in the tile being modified
      activeBeams.sort((beam) => tile.items.some((item) => item === beam) ? -1 : 0)
    }

    this.#updateBeams(activeBeams)
  }

  #onSolved () {
    console.log('puzzle solved')

    this.solved = true

    this.#updateSelectedTile(undefined)

    // TODO: should probably refactor the mask method to allow easier calling from puzzle itself
    emitEvent(Puzzle.Events.Solved, { configurator: Puzzle.solvedConfigurator, filter: Puzzle.solvedMask })
  }

  #onTerminusConnection (event) {
    console.log('onTerminusConnection', event)
    const terminus = event.detail.terminus
    const openings = terminus.openings.filter((opening) => opening?.connected)
    const color = chroma.average(openings.map((opening) => opening.color)).hex()

    // Update connections
    const connection = this.connections.find((connection) => connection.color === color)
    if (connection) {
      connection.connected = true
      this.#updateState()
    }

    // Check for solution
    if (this.connections.every((connection) => connection.connected)) {
      this.#onSolved()
    }
  }

  #onTerminusDisconnection (event) {
    console.log('onTerminusDisconnection', event)
    const terminus = event.detail.terminus
    const connection = this.connections.find((connection) => connection.color === terminus.color)
    if (connection) {
      connection.connected = false
      this.#updateState()
    }
  }

  #onUpdate () {
    // TODO: check for solutions
  }

  #removeEventListeners () {
    Object.entries(this.#eventListeners)
      .forEach(([event, listener]) => document.removeEventListener(event, listener))
  }

  #removeLayers () {
    paper.project.clear()
  }

  #setState (connections) {
    elements.state.replaceChildren()

    connections.forEach((connection) => {
      const span = document.createElement('span')
      span.classList.add('connection', 'material-symbols-outlined')
      span.dataset.color = connection.color
      span.textContent = Puzzle.States.disconnected
      span.style.backgroundColor = connection.color
      span.title = 'Disconnected'
      elements.state.append(span)
    })
  }

  #updateBeams (beams) {
    if (!beams.length) {
      return
    }

    if (this.debug) {
      this.layout.layers.debug.clear()
    }

    beams.forEach((beam) => beam.step(this))

    const beamsToUpdate = beams.filter((beam) => beam.isActive())
    if (beamsToUpdate.length) {
      if (this.debug) {
        this.debugData.beamsToUpdate = beamsToUpdate
        return
      }
      this.#updateBeams(beamsToUpdate)
    }

    this.#onUpdate()
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

  #updateState () {
    this.connections.forEach((connection) => {
      const element = elements.state.querySelector(`[data-color="${connection.color}"]`)
      const state = connection.connected ? 'connected' : 'disconnected'
      element.classList.remove(...Object.keys(Puzzle.States))
      element.classList.add(state)
      element.textContent = Puzzle.States[state]
      element.title = capitalize(state)
    })
  }

  static Events = Object.freeze({
    Error: 'puzzle-error',
    Solved: 'puzzle-solved'
  })

  static States = Object.freeze({
    connected: 'power',
    disconnected: 'power_off'
  })

  static solvedConfigurator (tile) {
    const beams = tile.items.filter((item) => item.type === Item.Types.beam && item.getConnection() !== undefined)
    return { style: { fillColor: chroma.average(beams.map((beam) => beam.color)).hex() } }
  }

  static solvedMask (tile) {
    return tile.items.some((item) =>
      item.type === Item.Types.beam && item.getConnection() !== undefined)
  }
}
