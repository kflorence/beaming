import { Layout } from './layout'
import chroma from 'chroma-js'
import paper, { Layer, Path, Size } from 'paper'
import { addClass, base64encode, debounce, emitEvent, fuzzyEquals, noop, params, removeClass } from './util'
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
import { Tile } from './items/tile'
import { Editor } from './editor'
import { View } from './view'
import { Schema } from './schema'

const confirm = window.confirm

const elements = Object.freeze({
  canvas: document.getElementById('puzzle-canvas'),
  debug: document.getElementById('debug'),
  footer: document.getElementById('puzzle-footer'),
  footerMessage: document.getElementById('puzzle-footer-message'),
  headerMenu: document.getElementById('puzzle-header-menu'),
  headerMessage: document.getElementById('puzzle-header-message'),
  id: document.getElementById('puzzle-id'),
  next: document.getElementById('puzzle-next'),
  previous: document.getElementById('puzzle-previous'),
  recenter: document.getElementById('puzzle-recenter'),
  redo: document.getElementById('puzzle-redo'),
  reset: document.getElementById('puzzle-reset'),
  undo: document.getElementById('puzzle-undo'),
  title: document.querySelector('title'),
  wrapper: document.getElementById('puzzle-wrapper')
})

// There are various spots below that utilize setTimeout in order to process events in order and to prevent
// long-running computations from blocking UI updates.
// See: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Event_loop
export class Puzzle {
  connections = []
  debug = params.has('debug')
  element = elements.canvas
  error = false
  layers = {}
  message
  selectedTile
  solved = false
  state

  #beamsUpdateDelay = 30
  #collisions = {}
  #editor
  #eventListeners = new EventListeners({ context: this })
  #interact
  #isUpdatingBeams = false
  #isTearingDown = false
  #mask
  #maskQueue = []
  #solution

  constructor () {
    // Don't automatically insert items into the scene graph, they must be explicitly inserted
    paper.settings.insertItems = false
    // noinspection JSCheckFunctionSignatures
    paper.setup(elements.canvas)

    // These layers will be added in the order they are defined
    this.layers.mask = new Layer()
    this.layers.collisions = new Layer()
    this.layers.debug = new Layer()

    if (params.has(State.ParamKeys.Edit)) {
      // Edit mode
      this.#editor = new Editor(this)
    }

    this.resize(false)

    this.#eventListeners.add([
      { type: Beam.Events.Update, handler: this.#onBeamUpdate },
      { type: 'change', element: elements.id, handler: this.#onSelect },
      { type: 'click', element: elements.next, handler: this.#next },
      { type: 'click', element: elements.previous, handler: this.#previous },
      { type: 'click', element: elements.recenter, handler: this.#onRecenter },
      { type: 'click', element: elements.redo, handler: this.#redo },
      { type: 'click', element: elements.reset, handler: this.#reset, options: { passive: true } },
      { type: 'click', element: elements.undo, handler: this.#undo },
      { type: 'keyup', handler: this.#onKeyup },
      { type: Modifier.Events.Invoked, handler: this.#onModifierInvoked },
      { type: Modifier.Events.Toggled, handler: this.#onModifierToggled },
      { type: 'pointermove', element: elements.canvas, handler: this.#onPointerMove },
      { type: Puzzle.Events.Mask, handler: this.#onMask },
      { type: 'resize', element: window, handler: debounce(this.resize.bind(this)) },
      { type: Stateful.Events.Update, handler: this.#onStateUpdate },
      { type: 'tap', element: elements.canvas, handler: this.#onTap }
    ])

    this.#interact = new Interact(elements.canvas)
    this.#updateDropdown()

    this.select()

    if (this.#editor) {
      this.#editor.setup()
    }
  }

  centerOnTile (offset) {
    const tile = this.layout.getTile(offset)
    View.setCenter(tile.center)
    return tile.equals(this.selectedTile)
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

  getBeams () {
    return this.layout.getItems()
      .filter((item) => item.type === Item.Types.terminus)
      .flatMap((terminus) => terminus.beams)
  }

  getBeamsUpdateDelay () {
    return this.#beamsUpdateDelay
  }

  getMoves () {
    return this.state.moves()
  }

  getProjectPoint (point) {
    return this.#interact.getProjectPoint(point)
  }

  getSolution () {
    return base64encode(JSON.stringify(this.getMoves()))
  }

  getTile (point) {
    const result = paper.project.hitTest(point.ceil(), {
      fill: true,
      match: (result) => result.item.data.type === Item.Types.tile,
      segments: true,
      stroke: true,
      tolerance: 0
    })
    return result ? this.layout.getTile(result.item.data.coordinates.offset) : result
  }

  mask (mask) {
    if (this.#mask) {
      if (this.#mask.equals(mask)) {
        console.debug(mask)
        throw new Error(`Duplicate mask detected: ${mask.id}`)
      }

      console.debug('adding mask to queue', mask)
      this.#maskQueue.push(mask)
      return
    }

    this.#mask = mask

    // TODO animation?
    const tiles = this.layout.tiles.filter(mask.tileFilter)
      .map((tile) => new Mask(
        tile,
        typeof mask.configuration.style === 'function'
          ? mask.configuration.style(tile)
          : mask.configuration.style
      ))

    this.layers.mask.addChildren(tiles.map((tile) => tile.group))

    if (mask.message) {
      elements.headerMessage.textContent = mask.message
    }

    mask.onMask(this)

    document.body.classList.add(Puzzle.Events.Mask)
  }

  recenter (force = false) {
    if (!this.layout) {
      return
    }

    const center = View.getCenter()
    if (center && !force) {
      // If cache exists for this view size, use that
      paper.view.center = center
    } else {
      // Otherwise set to the center of the view
      View.setCenter(this.layout.getCenter())
    }
  }

  reload (state) {
    this.error = false
    document.body.classList.remove(Puzzle.Events.Error)

    if (this.state) {
      this.#teardown()
    }

    if (state instanceof State) {
      // Reset state
      this.state = state
    } else if (typeof state === 'object') {
      // Update current state
      this.state.update(state)
    }

    try {
      this.#setup()
    } catch (e) {
      this.#onError(e, 'Puzzle configuration is invalid.')
      this.#updateActions()
    }

    emitEvent(Puzzle.Events.Updated, { state: this.state })
  }

  resize (reload = true) {
    const { width, height } = elements.wrapper.getBoundingClientRect()

    const newSize = new Size(width, height)
    if (paper.view.viewSize.equals(newSize)) {
      // Nothing to do
      return
    }

    elements.canvas.height = height
    elements.canvas.width = width
    elements.canvas.style.height = height + 'px'
    elements.canvas.style.width = width + 'px'

    paper.view.viewSize = newSize

    this.recenter()

    if (reload) {
      // For some reason, without reload, setting viewSize alone breaks the project coordinate space
      // See: https://github.com/paperjs/paper.js/issues/1757
      // Forcing a reload fixes it.
      this.reload()
    }
  }

  select (id) {
    if (id !== undefined && id === this.state?.getId()) {
      // This ID is already selected
      return
    }

    this.reload(State.resolve(id))
  }

  unmask () {
    console.debug('unmask', this.#mask)
    if (!this.#mask) {
      return
    }

    this.layers.mask.removeChildren()
    this.#updateMessage(this.selectedTile)
    this.#mask.onUnmask(this)
    this.#mask = undefined

    document.body.classList.remove(Puzzle.Events.Mask)

    const mask = this.#maskQueue.pop()
    if (mask) {
      console.debug('processing next mask in queue', mask)
      // Evaluate after any current events have processed (e.g. beam updates from last mask)
      setTimeout(() => {
        // Allow mask to update since state may have changed since it was queued
        // If onUpdate returns false the mask will not be applied
        if (mask.onUpdate() !== false) {
          this.mask(mask)
        }
      })
    }
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
    this.state.setSelectedTile(tile)
    this.#updateMessage(tile)
    this.#updateModifiers(tile, previouslySelectedTile)

    if (previouslySelectedTile && previouslySelectedTile !== tile) {
      previouslySelectedTile.onDeselected(tile)
    }

    if (tile && tile !== previouslySelectedTile) {
      tile.onSelected(previouslySelectedTile)
    }

    return previouslySelectedTile
  }

  updateState (state) {
    if (this.#isTearingDown) {
      // Ignore any state updates when tearing down
      return
    }

    state ??= Object.assign(this.state.getCurrent(), { layout: this.layout.getState() })

    this.state.update(state)
    this.#updateDropdown()
    this.#updateActions()

    emitEvent(Puzzle.Events.Updated, { state: this.state })
  }

  #getModifiers (tile) {
    // Sort by ID to ensure they always appear in the same order regardless of ownership
    return this.layout.modifiers.concat(tile?.modifiers || [])
      .sort((a, b) => a.id - b.id)
  }

  #next () {
    const id = Puzzles.visible.nextId(this.state.getId())
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

    this.getBeams()
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
    elements.headerMessage.textContent = message
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
    const modifier = event.detail.modifier
    const tile = event.detail.tile

    if (
      // Modifier does not belong to a tile
      !modifier.parent &&
      // Tile has a lock modifier
      tile.modifiers.some((modifier) => modifier.type === Modifier.Types.lock) &&
      // Tile does not already have a modifier of this type
      !tile.modifiers.some((other) => other.type === modifier.type) &&
      // Tile has less than the maximum number of modifiers
      tile.modifiers.length < Tile.MaxModifiers
    ) {
      console.debug('locking modifier to tile', modifier, tile)
      this.layout.removeModifier(modifier)
      modifier.move(tile)
      // Disable any other attached modifiers of this type to prevent duplicate locking
      this.#getModifiers(tile)
        .filter((other) => other.type === modifier.type && other.id !== modifier.id)
        .forEach((other) => other.update({ disabled: true }))
    }

    const selectedTile = event.detail.selectedTile
    if (selectedTile) {
      this.updateSelectedTile(selectedTile)
    }

    this.state.addMove(event.type, tile, modifier, selectedTile)
    this.updateState()

    this.getBeams()
      // Update beams in the tile being modified first
      .sort((beam) => tile.items.some((item) => item === beam) ? -1 : 0)
      .forEach((beam) => beam.onModifierInvoked(event, this))

    setTimeout(() => this.update(), 0)
  }

  #onModifierToggled (event) {
    this.state.addMove(event.type, this.selectedTile, event.detail.modifier)
    this.updateState()
  }

  #onPointerMove (event) {
    if (!this.debug) {
      return
    }

    const point = this.#interact.getProjectPoint(Interact.point(event))
    const result = paper.project.hitTest(point)

    elements.debug.textContent = ''

    switch (result?.item.data.type) {
      case Item.Types.tile: {
        const tile = this.layout.getTile(result.item.data.coordinates.offset)
        elements.debug.textContent = tile.toString()
        break
      }
    }
  }

  #onRecenter () {
    this.recenter(true)
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
    span.classList.add(Puzzle.ClassNames.Icon)
    span.textContent = 'celebration'
    span.title = 'Solved!'

    elements.headerMessage.replaceChildren(span)

    document.body.classList.add(Puzzle.Events.Solved)
    emitEvent(Puzzle.Events.Solved)
  }

  #onStateUpdate (event) {
    console.debug('Puzzle.#onStateUpdate()', event)
    this.updateState()
  }

  #onTap (event) {
    let tile

    if ((this.#editor && !this.#editor.isLocked()) || this.solved || this.error) {
      // In a state that cannot be interacted with
      return
    }

    const result = paper.project.hitTest(event.detail.point)

    switch (result?.item.data.type) {
      case Item.Types.mask:
        return
      case Item.Types.tile:
        tile = this.layout.getTile(result.item.data.coordinates.offset)
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
    const id = Puzzles.visible.previousId(this.state.getId())
    if (id) {
      this.select(id)
    }
  }

  #redo () {
    if (this.state.redo()) {
      this.reload()
    }
  }

  #removeLayers () {
    Object.values(this.layers).forEach((layer) => {
      // For some reason children are not being removed from some layers (e.g. mask) with .remove()
      layer.removeChildren()
      layer.remove()
    })
  }

  #reset () {
    if (confirm('Are you sure you want to reset this puzzle? This cannot be undone.') && this.state.reset()) {
      setTimeout(() => this.reload())
    }
  }

  #setup () {
    const { layout, message, solution } = this.state.getCurrent()

    this.layout = new Layout(layout)
    this.message = message
    this.#solution = new Solution(solution)

    Object.values(this.layers).forEach((layer) => paper.project.addLayer(layer))

    document.body.classList.add(Puzzle.Events.Loaded)

    const selectedTileId = this.state.getSelectedTile()
    const selectedTile = selectedTileId
      ? this.layout.getTile(new OffsetCoordinates(...selectedTileId.split(',')))
      : undefined

    this.updateSelectedTile(selectedTile)
    this.updateState()
    this.update()
  }

  #teardown () {
    document.body.classList.remove(...Object.values(Puzzle.Events))

    this.#isTearingDown = true
    this.#maskQueue = []

    this.unmask()
    this.#removeLayers()

    this.#solution?.teardown()
    this.#solution = undefined
    this.solved = false
    this.layout?.teardown()
    this.layout = undefined
    this.selectedTile = undefined
    this.#collisions = {}
    this.#isUpdatingBeams = false
    this.#isTearingDown = false
  }

  #undo () {
    if (this.state.undo()) {
      this.reload()
    }
  }

  #updateActions () {
    const id = this.state.getId()
    const title = this.state.getTitle()

    // Update browser title
    elements.title.textContent = `${this.#editor ? 'Editing' : 'Beaming'}: Puzzle ${title}`

    removeClass(Puzzle.ClassNames.Disabled, ...Array.from(elements.headerMenu.children))

    const disable = []

    if (!this.state.canUndo()) {
      disable.push(elements.undo)
    }

    if (!this.state.canRedo()) {
      disable.push(elements.redo)
    }

    if (!this.state.canReset()) {
      disable.push(elements.reset)
    }

    if (!Puzzles.visible.has(id)) {
      // Custom puzzle
      disable.push(elements.previous, elements.next)
    } else {
      if (id === Puzzles.visible.firstId) {
        disable.push(elements.previous)
      } else if (id === Puzzles.visible.lastId) {
        disable.push(elements.next)
      }
    }

    addClass(Puzzle.ClassNames.Disabled, ...disable)
  }

  #updateDropdown () {
    elements.id.replaceChildren()

    // TODO support pulling custom IDs from local cache
    const options = Array.from(Puzzles.visible.ids).map((id) => ({ id, title: Puzzles.titles[id] }))
    const id = this.state?.getId()
    if (id !== undefined && !Puzzles.visible.ids.includes(id)) {
      options.push({ id, title: this.state.getTitle() })
    }

    for (const option of options) {
      const $option = document.createElement('option')
      $option.value = option.id
      $option.innerText = option.title
      elements.id.append($option)
    }

    // Select current ID
    elements.id.value = id
  }

  #updateBeams () {
    const beams = this.getBeams().filter((beam) => beam.isPending())

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
    setTimeout(() => this.#updateBeams(), this.#beamsUpdateDelay)
  }

  #updateMessage (tile) {
    elements.headerMessage.textContent = this.message
    elements.footerMessage.replaceChildren()

    if (tile) {
      // Check to see if tile has any color elements that need to be displayed
      // Note: these will only be displayed if the tile contains an item with more than one color
      const colorElements = tile.items
        .map((item) => item.getColorElements(tile))
        .find((colorElements) => colorElements.length > 1) || []
      elements.footerMessage.replaceChildren(...colorElements)
    }
  }

  #updateModifiers (tile, previouslySelectedTile) {
    this.#getModifiers(previouslySelectedTile).forEach((modifier) => modifier.detach())

    const modifiers = this.#getModifiers(tile)
    modifiers.forEach((modifier) => modifier.attach(tile))

    elements.footer.classList.toggle(Puzzle.ClassNames.Active, modifiers.length > 0)
  }

  // Filters for all beams that are connected to the terminus, or have been merged into a beam that is connected
  static #connectedBeams = (item) => item.type === Item.Types.beam && item.isConnected()

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

  static ClassNames = Object.freeze({
    Active: 'active',
    Disabled: 'disabled',
    Icon: 'icon'
  })

  static Events = Object.freeze({
    Error: 'puzzle-error',
    Loaded: 'puzzle-loaded',
    Mask: 'puzzle-mask',
    Solved: 'puzzle-solved',
    Updated: 'puzzle-updated'
  })

  static Mask = class {
    constructor (configuration = {}) {
      configuration.style ??= {}
      this.configuration = configuration

      this.id = configuration.id
      this.message = configuration.message
      this.tileFilter = configuration.tileFilter ?? noop(true)
      this.onMask = configuration.onMask ?? noop
      this.onTap = configuration.onTap ?? noop
      this.onUnmask = configuration.onUnmask ?? noop
      this.onUpdate = configuration.onUpdate ?? noop
    }

    equals (other) {
      return this.id === other.id
    }
  }

  static #solvedMask = new Puzzle.Mask({
    style: (tile) => {
      const beams = tile.items.filter(Puzzle.#connectedBeams)
      const colors = beams.flatMap((beam) => beam.getSteps(tile).flatMap((step) => step.color))
      return { fillColor: chroma.average(colors).hex() }
    },
    tileFilter: (tile) => tile.items.some(Puzzle.#connectedBeams)
  })

  static Schema = Object.freeze({
    $id: Schema.$id('puzzle'),
    properties: {
      author: {
        type: 'string'
      },
      description: {
        format: 'textarea',
        type: 'string'
      },
      layout: Layout.Schema,
      solution: Solution.Schema,
      version: {
        default: 0,
        type: 'number'
      }
    },
    required: [
      'layout',
      'version'
    ],
    title: 'Puzzle',
    type: 'object'
  })
}
