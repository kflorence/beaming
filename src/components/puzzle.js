import { Layout } from './layout'
import chroma from 'chroma-js'
import paper, { Layer, Path, Tool } from 'paper'
import { emitEvent } from './util'
import { Item } from './item'
import { Mask } from './items/mask'
import { Modifier } from './modifier'
import { Beam } from './items/beam'
import { Terminus } from './items/terminus'
import { Collision } from './items/collision'

const elements = Object.freeze({
  connections: document.getElementById('connections'),
  connectionsRequired: document.getElementById('connections-required'),
  message: document.getElementById('message')
})

export class Puzzle {
  connections = []
  connectionsRequired
  debug = false
  debugData = {}
  layers = {}
  selectedTile
  solved = false

  #beams
  #collisions = {}
  #eventListeners = {}
  #isDragging = false
  #mask
  #termini
  #tiles
  #tool

  constructor (id, { connectionsRequired, layout, title }) {
    this.layout = new Layout(layout)

    this.#tiles = this.layout.tiles.flat().filter((tile) => tile)
    this.#termini = this.layout.items.filter((item) => item.type === Item.Types.terminus)
    this.#beams = this.#termini.flatMap((terminus) => terminus.beams)
    this.#tool = new Tool()

    this.layers.mask = new Layer()
    this.layers.collisions = new Layer()
    this.layers.debug = new Layer()

    this.id = id
    this.title = title

    elements.message.textContent = title

    this.connectionsRequired = connectionsRequired

    this.#setState()

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

  getItems (tile) {
    return (tile ? this.#tiles.filter((t) => t === tile) : this.#tiles).flatMap((tile) => tile.items)
  }

  getTile (point) {
    const result = paper.project.hitTest(point, {
      fill: true,
      match: (result) => result.item.data.type === Item.Types.tile,
      segments: true,
      stroke: true,
      tolerance: 0
    })
    return result ? this.layout.getTile(result.item.data.coordinates.axial) : result
  }

  mask (event) {
    console.debug('Mask event', event)
    this.#onMask(event.detail.mask)
  }

  teardown () {
    document.body.classList.remove(...Object.values(Puzzle.Events))
    this.#tiles.map((tile) => tile.teardown())
    this.#removeEventListeners()
    this.#removeLayers()
  }

  unmask () {
    this.#mask = undefined
    this.layers.mask.removeChildren()
  }

  #addEventListeners () {
    paper.view.onClick = (event) => this.#onClick(event)
    this.#tool.onMouseDrag = (event) => this.#onMouseDrag(event)
    this.#tool.onMouseUp = (event) => this.#onMouseUp(event)

    Object.entries({
      keyup: this.#onKeyup,
      [Beam.Events.Update]: this.#onBeamUpdate,
      [Modifier.Events.Invoked]: this.#onModifierInvoked,
      [Puzzle.Events.Mask]: this.mask,
      [Terminus.Events.Connection]: this.#onTerminusConnection,
      [Terminus.Events.Disconnection]: this.#onTerminusConnection
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
      this.layout.layers.items,
      this.layers.mask,
      this.layers.collisions,
      this.layers.debug
    ].forEach((layer) => paper.project.addLayer(layer))
  }

  #onBeamUpdate (event) {
    if (event.detail.step?.state.collision) {
      const point = event.detail.step.point
      const collisionId = [Math.round(point.x), Math.round(point.y)].join(',')
      const collision = this.#collisions[collisionId]

      if (collision) {
        if (!collision.beams.some((beam) => beam === event.detail.beam)) {
          collision.beams.push(event.detail.beam)
        }
      } else {
        this.#collisions[collisionId] = { beams: [event.detail.beam], point }
      }
    }

    this.#updateCollisions()
  }

  #onClick (event) {
    let tile

    if (this.#isDragging || this.solved) {
      return
    }

    const result = paper.project.hitTest(event.point)

    switch (result?.item.data.type) {
      case Item.Types.mask:
        return
      case Item.Types.tile:
        tile = this.layout.getTile(result.item.data.coordinates.axial)
        break
    }

    // There is an active mask
    if (this.#mask) {
      this.#mask.onClick(this, tile && tile !== this.selectedTile ? tile : undefined)
    }

    if (!this.#mask) {
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

  #onMask (mask) {
    if (this.#mask) {
      console.error('Ignoring mask request due to existing mask', mask, this.#mask)
      return
    }

    this.#mask = mask

    // TODO animation?
    const tiles = this.#tiles.filter(mask.filter)
      .map((tile) => new Mask(
        tile,
        typeof mask.configuration === 'function' ? mask.configuration(tile) : mask.configuration
      ))

    this.layers.mask.addChildren(tiles.map((tile) => tile.group))
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

  #onMouseDrag (event) {
    if (!this.#isDragging) {
      document.body.classList.add('grab')
    }

    this.#isDragging = true

    // Center on the cursor
    paper.view.center = event.downPoint.subtract(event.point).add(paper.view.center)
  }

  #onMouseUp () {
    this.#isDragging = false
    document.body.classList.remove('grab')
  }

  #onSolved () {
    this.solved = true

    this.#updateSelectedTile(undefined)
    this.#onMask(Puzzle.#solvedMask)

    emitEvent(Puzzle.Events.Solved)
  }

  #onTerminusConnection (event) {
    const terminus = event.detail.terminus
    const connectionIndex = this.connections.findIndex((connection) => connection === terminus)
    const openings = terminus.openings.filter((opening) => opening?.connected)
    const color = openings.length ? chroma.average(openings.map((opening) => opening.color)).hex() : undefined

    if (connectionIndex >= 0) {
      const connection = this.connections[connectionIndex]
      // No longer connected
      if (connection.color !== color) {
        this.connections.splice(connectionIndex, 1)
      }
    } else if (terminus.color === color) {
      this.connections.push(terminus)
    }

    this.#updateState()
  }

  #removeEventListeners () {
    Object.entries(this.#eventListeners)
      .forEach(([event, listener]) => {
        // noinspection JSCheckFunctionSignatures
        document.removeEventListener(event, listener)
      })
  }

  #removeLayers () {
    paper.project.clear()
  }

  #setState () {
    elements.connectionsRequired.textContent = this.connectionsRequired.toString()
    this.#updateState()
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
  }

  #updateCollisions () {
    Object.values(this.#collisions).forEach((collision) => {
      // Remove invalid beams
      collision.beams = collision.beams.filter((beam) => beam.done)

      const color = collision.beams.length
        ? chroma.average(collision.beams.map((beam) => beam.getLastStep().color)).hex()
        : undefined

      // Handle removal of collision items
      if (collision.item && (!collision.beams.length || collision.item.color !== color)) {
        collision.item.remove()
        collision.item = undefined
      }

      if (collision.beams.length && !collision.item) {
        collision.item = new Collision({ center: collision.point, color })
        this.layers.collisions.addChild(collision.item.group)
      }
    })
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
    const connections = this.connections.length

    elements.connections.textContent = connections.toString()

    // Check for solution
    if (connections === this.connectionsRequired) {
      this.#onSolved()
    }
  }

  static Events = Object.freeze({
    Error: 'puzzle-error',
    Mask: 'puzzle-mask',
    Solved: 'puzzle-solved'
  })

  static Mask = class {
    constructor (filter, onClick, configuration) {
      this.configuration = configuration
      this.filter = filter
      this.onClick = onClick
    }
  }

  static #solvedMask = new Puzzle.Mask(
    (tile) => {
      return tile.items.some((item) =>
        item.type === Item.Types.beam && item.getConnection() !== undefined)
    },
    undefined,
    (tile) => {
      const beams = tile.items.filter((item) => item.type === Item.Types.beam && item.getConnection() !== undefined)
      const colors = beams.flatMap((beam) => beam.getSteps(tile).map((step) => step.color))
      return { style: { fillColor: chroma.average(colors).hex() } }
    }
  )
}
