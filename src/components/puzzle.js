import { Layout } from './layout'
import chroma from 'chroma-js'
import paper, { Layer, Path, Tool } from 'paper'
import { emitEvent, fuzzyEquals } from './util'
import { Item } from './item'
import { Mask } from './items/mask'
import { Modifier } from './modifier'
import { Beam } from './items/beam'
import { Terminus } from './items/terminus'
import { Collision as CollisionItem } from './items/collision'

const elements = Object.freeze({
  connections: document.getElementById('connections'),
  connectionsRequired: document.getElementById('connections-required'),
  message: document.getElementById('message')
})

export class Puzzle {
  connections = []
  connectionsRequired
  debug = false
  layers = {}
  selectedTile
  solved = false

  #beams
  #collisions = {}
  #eventListeners = {}
  #isDragging = false
  #isUpdatingBeams = false
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

    this.update()
  }

  drawDebugPoint (point, style = {}) {
    const circle = new Path.Circle(Object.assign({
      radius: 3,
      fillColor: 'red',
      strokeColor: 'white',
      strokeWidth: 1,
      center: point
    }, style))
    this.layers.debug.addChild(circle)
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

  mask (mask) {
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

  update () {
    if (!this.#isUpdatingBeams) {
      this.#updateBeams()
    }
  }

  updateSelectedTile (tile) {
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

  #addEventListeners () {
    paper.view.onClick = (event) => this.#onClick(event)
    this.#tool.onMouseDrag = (event) => this.#onMouseDrag(event)
    this.#tool.onMouseUp = (event) => this.#onMouseUp(event)

    Object.entries({
      keyup: this.#onKeyup,
      [Beam.Events.Update]: this.#onBeamUpdate,
      [Modifier.Events.Invoked]: this.#onModifierInvoked,
      [Puzzle.Events.Mask]: this.#onMask,
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
    const stepAdded = event.detail.stepAdded
    if (stepAdded?.state.collision) {
      const point = stepAdded.point
      const collisionId = Puzzle.Collision.id(point)
      const collision = this.#collisions[collisionId]

      if (collision) {
        collision.addBeam(event.detail.beam)
      } else {
        this.#collisions[collisionId] = new Puzzle.Collision(this.layers.collisions, [event.detail.beam], point)
      }
    }

    Object.values(this.#collisions).forEach((collision) => collision.update())

    this.#beams
      .filter((beam) => beam !== event.detail.beam)
      .forEach((beam) => beam.onBeamUpdated(event, this))

    this.update()
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
      this.#mask.onClick(this, tile)
    } else {
      const previouslySelectedTile = this.updateSelectedTile(tile)

      if (tile && tile === previouslySelectedTile) {
        tile.onClick(event)
      }
    }
  }

  #onKeyup (event) {
    if (this.debug && event.key === 's') {
      this.#updateBeams()
    }
  }

  #onMask (event) {
    console.debug('Mask event', event)
    this.mask(event.detail.mask)
  }

  #onModifierInvoked (event) {
    const tile = event.detail.tile

    this.#beams
      // Update beams in the tile being modified first
      .sort((beam) => tile.items.some((item) => item === beam) ? -1 : 0)
      .forEach((beam) => beam.onModifierInvoked(event, this))

    this.#updateBeams()
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

    this.updateSelectedTile(undefined)
    this.mask(Puzzle.#solvedMask)

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

  #updateBeams () {
    this.#isUpdatingBeams = true

    const beams = this.#beams.filter((beam) => beam.isActive())

    if (!beams.length) {
      this.#isUpdatingBeams = false
      return
    }

    if (this.debug) {
      this.layers.debug.clear()
    }

    beams.forEach((beam) => beam.step(this))

    this.#updateBeams()
  }

  #updateState () {
    const connections = this.connections.length

    elements.connections.textContent = connections.toString()

    // Check for solution
    if (connections === this.connectionsRequired) {
      this.#onSolved()
    }
  }

  static Collision = class {
    constructor (layer, beams, point, item = undefined) {
      this.id = Puzzle.Collision.id(point)
      this.layer = layer
      this.beams = beams
      this.point = point
      this.item = item
    }

    addBeam (beam) {
      if (!this.beams.some((otherBeam) => otherBeam.id === beam.id)) {
        this.beams.push(beam)
      }

      return this.beams
    }

    addItem (color) {
      this.item = new CollisionItem({ center: this.point, color })
      this.layer.addChild(this.item.group)
    }

    getColor () {
      return this.beams.length
        ? chroma.average(this.beams.map((beam) => beam.getColor())).hex()
        : undefined
    }

    removeItem () {
      this.item.remove()
      this.item = undefined
    }

    update () {
      // Remove any beam which no longer matches its collision point
      this.beams = this.beams.filter((beam) => fuzzyEquals(beam.getCollision()?.point, this.point))

      const color = this.getColor()

      // Remove no longer valid collision items
      if (this.item && (!this.beams.length || this.item.color !== color)) {
        this.removeItem()
      }

      // Add missing collision items
      if (this.beams.length && !this.item) {
        this.addItem(color)
      }
    }

    static id (point) {
      return [Math.round(point.x), Math.round(point.y)].join(',')
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
