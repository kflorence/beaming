import { Layout } from './layout'
import chroma from 'chroma-js'
import paper, { Layer, Path, Size } from 'paper'
import { addClass, debounce, emitEvent, fuzzyEquals, removeClass } from './util'
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
import { EventListeners } from './eventListeners'
import { Solution } from './solution'
import { Interact } from './interact'

const elements = Object.freeze({
  main: document.getElementById('main'),
  message: document.getElementById('message'),
  next: document.getElementById('next'),
  previous: document.getElementById('previous'),
  puzzle: document.getElementById('puzzle'),
  puzzleId: document.getElementById('puzzle-id'),
  redo: document.getElementById('redo'),
  reset: document.getElementById('reset'),
  undo: document.getElementById('undo'),
  title: document.querySelector('title')
})

// There are various spots below that utilize setTimeout in order to process events in order and to prevent
// long-running computations from blocking UI updates.
// See: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Event_loop
export class Puzzle {
  connections = []
  debug = false
  error = false
  layers = {}
  message
  selectedTile
  solved = false

  #beams
  #collisions = {}
  #eventListeners = new EventListeners({ context: this })
  #interact
  #isUpdatingBeams = false
  #mask
  #solution
  #state
  #termini
  #tiles = []

  constructor () {
    // Don't automatically insert items into the scene graph, they must be explicitly inserted
    paper.settings.insertItems = false
    // noinspection JSCheckFunctionSignatures
    paper.setup(elements.puzzle)

    this.#resize()

    this.layers.mask = new Layer()
    this.layers.collisions = new Layer()
    this.layers.debug = new Layer()

    this.#eventListeners.add([
      { type: Beam.Events.Update, handler: this.#onBeamUpdate },
      { type: 'change', element: elements.puzzleId, handler: this.#onSelect },
      { type: 'click', element: elements.next, handler: this.#next },
      { type: 'click', element: elements.previous, handler: this.#previous },
      { type: 'click', element: elements.redo, handler: this.#redo },
      { type: 'click', element: elements.reset, handler: this.#reset },
      { type: 'click', element: elements.undo, handler: this.#undo },
      { type: 'keyup', handler: this.#onKeyup },
      { type: Modifier.Events.Invoked, handler: this.#onModifierInvoked },
      { type: Puzzle.Events.Mask, handler: this.#onMask },
      { type: 'resize', element: window, handler: debounce(this.#resize) },
      { type: Stateful.Events.Update, handler: this.#onStateUpdate },
      { type: 'tap', element: elements.puzzle, handler: this.#onTap }
    ])

    this.#interact = new Interact(elements.puzzle)
    this.#updateDropdown()

    this.select()
  }

  centerOnTile (offset) {
    const tile = this.layout.getTileByOffset(offset)
    paper.view.center = tile.center
  }

  clearDebugPoints () {
    this.layers.debug.clear()
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

  select (id) {
    if (id !== undefined && id === this.#state?.getId()) {
      // This ID is already selected
      return
    }

    try {
      this.#state = State.resolve(id)
    } catch (e) {
      this.#onError(e, 'Could not load puzzle.')
    }

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
      this.#isUpdatingBeams = true
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
    this.#updateActions()
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

  #next () {
    const id = Puzzles.visible.nextId(this.#state.getId())
    if (id) {
      this.select(id)
    }
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

    setTimeout(() => this.update(), 0)
  }

  #onError (error, message, cause) {
    this.error = true

    // Support exclusion of error
    if (typeof error === 'string') {
      message = error
      cause = message
      error = undefined
    }

    if (error) {
      console.error(error)
    }

    cause = cause ?? error?.cause
    if (cause) {
      console.error('cause:', cause)
    }

    message = message ?? error?.message ?? 'The puzzle has encountered an error, please consider reporting.'
    elements.message.textContent = message
    document.body.classList.add(Puzzle.Events.Error)
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

    setTimeout(() => this.update(), 0)
  }

  #onSelect (event) {
    this.select(event.target.value)
  }

  #onSolved () {
    if (this.solved) {
      return
    }

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

  #onTap (event) {
    let tile

    if (this.solved || this.error) {
      return
    }

    const result = paper.project.hitTest(event.detail.point)

    switch (result?.item.data.type) {
      case Item.Types.mask:
        return
      case Item.Types.tile:
        tile = this.layout.getTileByAxial(result.item.data.coordinates.axial)
        break
    }

    // There is an active mask
    if (this.#mask) {
      this.#mask.onTap(this, tile)
    } else {
      const previouslySelectedTile = this.updateSelectedTile(tile)

      if (tile && tile === previouslySelectedTile) {
        tile.onTap(event)
      }
    }
  }

  #previous () {
    const id = Puzzles.visible.previousId(this.#state.getId())
    if (id) {
      this.select(id)
    }
  }

  #redo () {
    this.#state.redo()
    this.#reload()
  }

  #reload () {
    this.error = false

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

  #reset () {
    this.#state.reset()
    this.#reload()
  }

  #resize () {
    const { width, height } = elements.main.getBoundingClientRect()
    elements.puzzle.style.height = height + 'px'
    elements.puzzle.style.width = width + 'px'
    paper.view.viewSize = new Size(width, height)
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

    this.#addLayers()

    document.body.classList.add(Puzzle.Events.Loaded)

    const selectedTileId = this.#state.getSelectedTile()
    const selectedTile = selectedTileId
      ? this.layout.getTileByOffset(new OffsetCoordinates(...selectedTileId.split(',')))
      : undefined

    this.updateSelectedTile(selectedTile)
    this.update()
    this.#updateActions()
  }

  #teardown () {
    document.body.classList.remove(...Object.values(Puzzle.Events))

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
    this.#isUpdatingBeams = false
    this.#mask = undefined
    this.#termini = []
  }

  #undo () {
    this.#state.undo()
    this.#reload()
  }

  #updateActions () {
    const id = this.#state.getId()
    const title = this.#state.getTitle()

    // Update browser title
    elements.title.textContent = `Beaming: Puzzle ${title}`

    removeClass('disabled', ...Array.from(document.querySelectorAll('#actions li')))

    const disable = []

    if (!this.#state.canUndo()) {
      disable.push(elements.undo)
    }

    if (!this.#state.canRedo()) {
      disable.push(elements.redo)
    }

    if (!Puzzles.visible.has(id)) {
      // Custom puzzle
      elements.puzzleId.value = ''
      disable.push(elements.previous, elements.next)
    } else {
      elements.puzzleId.value = id

      if (id === Puzzles.visible.firstId) {
        disable.push(elements.previous)
      } else if (id === Puzzles.visible.lastId) {
        disable.push(elements.next)
      }
    }

    addClass('disabled', ...disable)
  }

  #updateDropdown () {
    elements.puzzleId.replaceChildren()
    for (const id of Puzzles.visible.ids) {
      const option = document.createElement('option')
      option.value = id
      option.innerText = Puzzles.titles[id]
      elements.puzzleId.append(option)
    }
  }

  #updateBeams () {
    const beams = this.#beams.filter((beam) => beam.isPending())

    if (!beams.length) {
      this.#isUpdatingBeams = false

      // Ensure we check for a solution after all other in-progress events have processed
      setTimeout(() => {
        if (this.#solution.isSolved()) {
          this.#onSolved()
        }
      }, 0)
      return
    }

    if (this.debug) {
      this.layers.debug.clear()
    }

    beams.forEach((beam) => beam.step(this))

    // Ensure the UI has a chance to update between loops
    setTimeout(() => this.#updateBeams(), 30)
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

    equals (other) {
      return fuzzyEquals(this.point, other?.point)
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
      this.beams = this.beams.filter((beam) => this.equals(beam.getCollision()))

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
      const rounded = point.round()
      return [rounded.x, rounded.y].join(',')
    }
  }

  static Events = Object.freeze({
    Error: 'puzzle-error',
    Loaded: 'puzzle-loaded',
    Mask: 'puzzle-mask',
    Solved: 'puzzle-solved',
    Updated: 'puzzle-updated'
  })

  static Mask = class {
    constructor (filter, configuration = {}) {
      configuration.style = configuration.style || {}

      this.configuration = configuration
      this.filter = filter

      this.onTap = configuration.onTap
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
