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
import { Stateful } from './stateful'
import { OffsetCoordinates } from './coordinates/offset'
import { StateManager } from './stateManager'
import { Puzzles } from '../puzzles'

const elements = Object.freeze({
  beams: document.getElementById('beams'),
  connections: document.getElementById('connections'),
  connectionsRequired: document.getElementById('connections-required'),
  message: document.getElementById('message')
})

export class Puzzle extends Stateful {
  connections = []
  debug = false
  layers = {}
  message
  selectedTile
  solution
  solved = false

  #beams
  #collisions = {}
  #eventListeners = {}
  #isDragging = false
  #isUpdatingBeams = false
  #mask
  #termini
  #tiles = []
  #tool

  constructor (canvas) {
    super(null)

    // Don't automatically insert items into the scene graph, they must be explicitly inserted
    paper.settings.insertItems = false
    paper.setup(canvas)
    paper.view.onClick = (event) => this.#onClick(event)

    this.layers.mask = new Layer()
    this.layers.collisions = new Layer()
    this.layers.debug = new Layer()

    this.stateManager = new StateManager()

    this.#tool = new Tool()
    this.#tool.onMouseDrag = (event) => this.#onMouseDrag(event)
    this.#tool.onMouseUp = (event) => this.#onMouseUp(event)
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
    const result = paper.project.hitTest(point.ceil(), {
      fill: true,
      match: (result) => result.item.data.type === Item.Types.tile,
      segments: true,
      stroke: true,
      tolerance: 0
    })
    return result ? this.layout.getTileByAxial(result.item.data.coordinates.axial) : result
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

    if (mask.message) {
      elements.message.textContent = mask.message
    }
  }

  next () {
    const id = Puzzles.nextId(this.stateManager.getState().getId())
    if (id) {
      this.select(id)
    }
  }

  previous () {
    const id = Puzzles.previousId(this.stateManager.getState().getId())
    if (id) {
      this.select(id)
    }
  }

  reset () {
    this.stateManager.resetState()
    this.select(this.stateManager.getState().getId())
  }

  select (id) {
    if (this.stateManager.getState()) {
      this.#teardown()
    }

    document.body.classList.remove(Puzzle.Events.Error)

    try {
      const state = this.stateManager.setState(id)
      const current = state.getCurrent()

      this.setState(current)
      this.#setup(current)

      emitEvent(Puzzle.Events.Selected, { state })
    } catch (e) {
      console.error(e)
      elements.message.textContent = 'Invalid puzzle.'
      document.body.classList.add(Puzzle.Events.Error)
    }
  }

  unmask () {
    this.#mask = undefined
    this.layers.mask.removeChildren()
    this.#updateMessage(this.selectedTile)
    this.update()
  }

  update () {
    if (!this.#mask && !this.#isUpdatingBeams) {
      this.#updateBeams()
    }
  }

  updateSelectedTile (tile) {
    const previouslySelectedTile = this.selectedTile

    this.selectedTile = tile
    this.stateManager.setSelectedTile(tile)
    this.#updateMessage(tile)

    if (previouslySelectedTile && previouslySelectedTile !== tile) {
      previouslySelectedTile.onDeselected(tile)
    }

    if (tile && tile !== previouslySelectedTile) {
      tile.onSelected(previouslySelectedTile)
    }

    return previouslySelectedTile
  }

  // noinspection JSCheckFunctionSignatures
  updateState () {
    this.stateManager.updateState(
      super.updateState((state) => {
        console.log('state', state)
        state.layout = this.layout.getState()
      }, false))
  }

  #addEventListeners () {
    Object.entries({
      keyup: this.#onKeyup,
      [Beam.Events.Update]: this.#onBeamUpdate,
      [Modifier.Events.Invoked]: this.#onModifierInvoked,
      [Puzzle.Events.Mask]: this.#onMask,
      [Stateful.Events.Update]: this.#onStateUpdate,
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
        tile = this.layout.getTileByAxial(result.item.data.coordinates.axial)
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
      this.update()
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

    this.update()
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

    const span = document.createElement('span')
    span.classList.add('material-symbols-outlined')
    span.textContent = 'celebration'
    span.title = 'Solved!'

    elements.message.replaceChildren(span)

    emitEvent(Puzzle.Events.Solved)
  }

  #onStateUpdate () {
    this.updateState()
  }

  #onTerminusConnection (event) {
    const terminus = event.detail.terminus
    const connectionIndex = this.connections.findIndex((connection) => connection === terminus)
    const openings = terminus.openings.filter((opening) => opening.connected)
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

    this.#updateSolution()
  }

  #removeEventListeners () {
    Object.entries(this.#eventListeners)
      .forEach(([event, listener]) => {
        // noinspection JSCheckFunctionSignatures
        document.removeEventListener(event, listener)
      })
  }

  #removeLayers () {
    Object.values(this.layers).forEach((layer) => layer.removeChildren())
    paper.project.clear()
  }

  #setSolution () {
    if (this.solution.connections) {
      elements.connectionsRequired.textContent = this.solution.connections.toString()
    } else {
      console.error('Invalid puzzle solution', this.solution)
      throw Error('Invalid puzzle solution')
    }

    this.#updateSolution()
  }

  #setup (state) {
    if (!state) {
      return
    }

    // Reset the item IDs, so they are unique per-puzzle
    Item.uniqueId = 0

    const { solution, layout, message } = state

    this.layout = new Layout(layout)

    this.message = message
    this.solution = solution

    this.#tiles = this.layout.tiles
    this.#termini = this.layout.items.filter((item) => item.type === Item.Types.terminus)
    this.#beams = this.#termini.flatMap((terminus) => terminus.beams)

    this.#addEventListeners()
    this.#addLayers()
    this.#setSolution()

    const selected = this.stateManager.getState().getSelectedTile()
    const selectedTile = selected
      ? this.layout.getTileByOffset(new OffsetCoordinates(...selected.split(',')))
      : undefined

    this.updateSelectedTile(selectedTile)
    this.update()
  }

  #teardown () {
    document.body.classList.remove(...Object.values(Puzzle.Events))

    this.#tiles.forEach((tile) => tile.teardown())
    this.#tiles = []

    this.#removeEventListeners()
    this.#removeLayers()

    this.connections = []
    this.layout.teardown()
    this.layout = undefined
    this.selectedTile = undefined
    this.solution = undefined
    this.solved = false

    this.#beams = []
    this.#collisions = {}
    this.#isDragging = false
    this.#isUpdatingBeams = false
    this.#mask = undefined
    this.#termini = []
  }

  #updateBeams () {
    this.#isUpdatingBeams = true

    const beams = this.#beams.filter((beam) => beam.isPending())

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

  #updateSolution () {
    const connections = this.connections.length

    elements.connections.textContent = connections.toString()

    // Check for solution
    if (connections === this.solution.connections) {
      this.#onSolved()
    }
  }

  #updateMessage (tile) {
    if (tile) {
      // Check to see if tile has any color elements that need to be displayed
      const colorElements = tile.items
        .map((item) => item.getColorElements(tile))
        .find((colorElements) => colorElements.length > 0) || []
      elements.message.replaceChildren(...colorElements)
    } else {
      elements.message.textContent = this.message || 'Select a tile'
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
      if (this.item) {
        this.item.remove()
        this.item = undefined
      }
    }

    update () {
      // Remove any beam which no longer matches its collision point
      this.beams = this.beams.filter((beam) => fuzzyEquals(beam.getStep()?.getCollision()?.point, this.point))

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
    Selected: 'puzzle-selected',
    Solved: 'puzzle-solved'
  })

  static Mask = class {
    constructor (filter, onClick, configuration, message) {
      this.configuration = configuration
      this.filter = filter
      this.onClick = onClick
      this.message = message
    }
  }

  // Filters for all beams that are connected to the terminus, or have been merged into a beam that is connected
  static #connectedBeams = (item) => item.type === Item.Types.beam && item.isConnected()

  static #solvedMask = new Puzzle.Mask(
    (tile) => {
      return tile.items.some(Puzzle.#connectedBeams)
    },
    undefined,
    (tile) => {
      const beams = tile.items.filter(Puzzle.#connectedBeams)
      const colors = beams.flatMap((beam) => beam.getSteps(tile).flatMap((step) => step.color))
      return { style: { fillColor: chroma.average(colors).hex() } }
    }
  )
}
