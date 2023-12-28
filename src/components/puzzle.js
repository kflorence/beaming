import { Layout } from './layout'
import chroma from 'chroma-js'
import paper, { Layer, Path, Tool } from 'paper'
import { deepEqual, emitEvent, fuzzyEquals } from './util'
import { Item } from './item'
import { Mask } from './items/mask'
import { Modifier } from './modifier'
import { Beam } from './items/beam'
import { Collision as CollisionItem } from './items/collision'
import { Stateful } from './stateful'
import { OffsetCoordinates } from './coordinates/offset'
import { State } from './state'
import { Puzzles } from '../puzzles'
import { StepState } from './step'
import { EventListener } from './eventListener'
import { Solution } from './solution'

const elements = Object.freeze({
  beams: document.getElementById('beams'),
  connections: document.getElementById('connections'),
  connectionsCompleted: document.getElementById('connections-completed'),
  connectionsRequired: document.getElementById('connections-required'),
  message: document.getElementById('message')
})

export class Puzzle {
  connections = []
  debug = false
  layers = {}
  message
  selectedTile
  solved = false

  #beams
  #collisions = {}
  #eventListener
  #isDragging = false
  #isUpdatingBeams = false
  #lastUpdateBeams
  #mask
  #solution
  #state
  #termini
  #tiles = []
  #tool

  constructor (canvas) {
    // Don't automatically insert items into the scene graph, they must be explicitly inserted
    paper.settings.insertItems = false
    paper.setup(canvas)

    this.layers.mask = new Layer()
    this.layers.collisions = new Layer()
    this.layers.debug = new Layer()

    this.#eventListener = new EventListener(this, {
      keyup: this.#onKeyup,
      [Beam.Events.Update]: this.#onBeamUpdate,
      [Modifier.Events.Invoked]: this.#onModifierInvoked,
      [Puzzle.Events.Mask]: this.#onMask,
      [Stateful.Events.Update]: this.#onStateUpdate
    })

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
        typeof mask.configuration.style === 'function'
          ? mask.configuration.style(tile)
          : mask.configuration.style
      ))

    this.layers.mask.addChildren(tiles.map((tile) => tile.group))

    if (mask.configuration.message) {
      elements.message.textContent = mask.configuration.message
    }
  }

  next () {
    const id = Puzzles.nextId(this.#state.getId())
    if (id) {
      this.select(id)
    }
  }

  previous () {
    const id = Puzzles.previousId(this.#state.getId())
    if (id) {
      this.select(id)
    }
  }

  redo () {
    this.#state.redo()
    this.#reload()
  }

  reset () {
    this.#state.reset()
    this.#reload()
  }

  select (id) {
    document.body.classList.remove(Puzzle.Events.Error)

    try {
      this.#state = State.resolve(id)
      this.#reload()
    } catch (e) {
      console.error(e)
      elements.message.textContent = 'Invalid puzzle.'
      document.body.classList.add(Puzzle.Events.Error)
    }
  }

  undo () {
    this.#state.undo()
    this.#reload()
  }

  unmask () {
    if (typeof this.#mask.onUnmask === 'function') {
      this.#mask.onUnmask(this)
    }

    this.#mask = undefined
    this.layers.mask.removeChildren()
    this.#updateMessage(this.selectedTile)
  }

  update () {
    if (!this.#mask && !this.#isUpdatingBeams) {
      this.#updateBeams()
    }
  }

  updateSelectedTile (tile) {
    const previouslySelectedTile = this.selectedTile

    this.selectedTile = tile
    this.#state.setSelectedTile(tile)
    this.#updateMessage(tile)

    if (previouslySelectedTile && previouslySelectedTile !== tile) {
      previouslySelectedTile.onDeselected(tile)
    }

    if (tile && tile !== previouslySelectedTile) {
      tile.onSelected(previouslySelectedTile)
    }

    return previouslySelectedTile
  }

  updateState () {
    this.#state.update(Object.assign(this.#state.getCurrent(), { layout: this.layout.getState() }))
    emitEvent(Puzzle.Events.Updated, { state: this.#state })
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
    const beam = event.detail.beam
    const state = event.detail.state

    if (state?.has(StepState.Collision)) {
      const collision = state.get(StepState.Collision)
      const collisionId = Puzzle.Collision.id(collision.point)
      const existing = this.#collisions[collisionId]

      if (existing) {
        existing.addBeam(beam)
      } else {
        this.#collisions[collisionId] = new Puzzle.Collision(this.layers.collisions, [beam], collision.point)
      }

      // Beam with collision has an active mask
      const mask = this.#mask?.configuration
      if (mask?.beam?.equals(beam)) {
        this.unmask()
      }
    }

    Object.values(this.#collisions).forEach((collision) => collision.update())

    this.#beams
      .filter((otherBeam) => otherBeam !== beam)
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
    const center = event.downPoint.subtract(event.point).add(paper.view.center)

    // Allow a little wiggle room
    if (paper.view.center.subtract(center).length > 1) {
      if (!this.#isDragging) {
        document.body.classList.add('grab')
      }

      // Note: MouseDrag is always called on mobile even when tapping, so only consider it actually dragging if
      // the cursor has moved the center
      this.#isDragging = true

      // Center on the cursor
      paper.view.center = center
    }
  }

  #onMouseUp (event) {
    if (!this.#isDragging) {
      this.#onClick(event)
    }

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

    document.body.classList.add(Puzzle.Events.Solved)
    emitEvent(Puzzle.Events.Solved)
  }

  #onStateUpdate () {
    this.updateState()
  }

  #reload () {
    if (this.#state) {
      this.#teardown()
    }

    this.#setup()

    emitEvent(Puzzle.Events.Updated, { state: this.#state })
  }

  #removeLayers () {
    Object.values(this.layers).forEach((layer) => layer.removeChildren())
    paper.project.clear()
  }

  #setup () {
    // Reset the item IDs, so they are unique per-puzzle
    Item.uniqueId = 0

    const { layout, message, solution } = this.#state.getCurrent()

    this.layout = new Layout(layout)
    this.message = message
    this.#solution = new Solution(solution)

    this.#tiles = this.layout.tiles
    this.#termini = this.layout.items.filter((item) => item.type === Item.Types.terminus)
    this.#beams = this.#termini.flatMap((terminus) => terminus.beams)

    this.#eventListener.addEventListeners()
    this.#addLayers()

    const selectedTileId = this.#state.getSelectedTile()
    const selectedTile = selectedTileId
      ? this.layout.getTileByOffset(new OffsetCoordinates(...selectedTileId.split(',')))
      : undefined

    this.updateSelectedTile(selectedTile)
    this.update()
  }

  #teardown () {
    document.body.classList.remove(...Object.values(Puzzle.Events))

    this.#eventListener.removeEventListeners()
    this.#removeLayers()

    this.#tiles.forEach((tile) => tile.teardown())
    this.#tiles = []
    this.#solution?.teardown()
    this.#solution = undefined
    this.solved = false
    this.layout?.teardown()
    this.layout = undefined
    this.selectedTile = undefined
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
      // Ensure we check for a solution after all other in-progress events have processed
      // See: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Event_loop
      setTimeout(() => {
        if (this.#solution.isSolved()) {
          this.#onSolved()
        }
        this.#isUpdatingBeams = false
      }, 0)
      return
    }

    if (this.debug) {
      this.layers.debug.clear()
    }

    // Prevent infinite looping when something is bugged
    const update = Object.fromEntries(beams.map((beam) => [beam.id, beam.step(this)]))
    if (deepEqual(update, this.#lastUpdateBeams)) {
      console.error('loop detected, exiting')
      return
    }

    this.#lastUpdateBeams = update
    this.#updateBeams()
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
      this.beams = this.beams.filter((beam) =>
        fuzzyEquals(beam.getStep()?.state.get(StepState.Collision)?.point, this.point))

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
    Solved: 'puzzle-solved',
    Updated: 'puzzle-updated'
  })

  static Mask = class {
    constructor (filter, configuration = {}) {
      configuration.style = configuration.style || {}

      this.configuration = configuration
      this.filter = filter

      this.onClick = configuration.onClick
      this.onUnmask = configuration.onUnmask
    }
  }

  // Filters for all beams that are connected to the terminus, or have been merged into a beam that is connected
  static #connectedBeams = (item) => item.type === Item.Types.beam && item.isConnected()

  static #solvedMask = new Puzzle.Mask(
    (tile) => tile.items.some(Puzzle.#connectedBeams),
    {
      style: (tile) => {
        const beams = tile.items.filter(Puzzle.#connectedBeams)
        const colors = beams.flatMap((beam) => beam.getSteps(tile).flatMap((step) => step.color))
        return { fillColor: chroma.average(colors).hex() }
      }
    }
  )
}
