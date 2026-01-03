import { Layout } from './layout'
import chroma from 'chroma-js'
import { confirm } from './dialog.js'
import paper, { Layer, Path, Point, Project, Size } from 'paper'
import {
  addClass,
  appendOption,
  base64encode, baseUrl, classToString,
  debounce,
  emitEvent, fadeIn, fadeOut,
  fuzzyEquals,
  noop,
  params,
  removeClass, url, writeToClipboard
} from './util'
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
import { Requirements } from './requirements.js'
import { Interact } from './interact'
import { View } from './view'
import { Schema } from './schema'
import { Game } from './game'
import { Icons } from './icon.js'
import Tippy from 'tippy.js'

const elements = Object.freeze({
  back: document.getElementById('back'),
  canvas: document.getElementById('puzzle-canvas-wrapper'),
  debug: document.getElementById('debug'),
  delete: document.getElementById('delete'),
  footer: document.getElementById('puzzle-footer'),
  footerMessage: document.getElementById('puzzle-footer-message'),
  headerMenu: document.getElementById('puzzle-header-menu'),
  headerMessage: document.getElementById('puzzle-header-message'),
  info: document.getElementById('puzzle-info'),
  infoAuthor: document.getElementById('puzzle-info-author'),
  infoId: document.getElementById('puzzle-info-id'),
  infoTitle: document.getElementById('puzzle-info-title'),
  recenter: document.getElementById('puzzle-recenter'),
  redo: document.getElementById('puzzle-redo'),
  reset: document.getElementById('puzzle-reset'),
  undo: document.getElementById('puzzle-undo'),
  select: document.getElementById('select'),
  share: document.getElementById('share'),
  title: document.querySelector('title'),
  wrapper: document.getElementById('puzzle-wrapper')
})

const tippy = Tippy(elements.share, {
  content: 'Share URL copied to clipboard!',
  theme: 'custom',
  trigger: 'manual'
})

// There are various spots below that utilize setTimeout in order to process events in order and to prevent
// long-running computations from blocking UI updates.
// See: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Event_loop
export class Puzzle {
  connections = []
  debug = params.has('debug')
  error = false
  layers = {}
  layout
  message
  modifiers = []
  project
  selectedTile
  solved = false
  state

  #beamsUpdateDelay = 30
  #collisions = {}
  #eventListeners = new EventListeners({ context: this })
  #interact
  #isUpdatingBeams = false
  #isTearingDown = false
  #mask
  #maskQueue = []
  #requirements

  constructor () {
    this.#interact = new Interact()
    this.#eventListeners.add([
      { type: Beam.Events.Update, handler: this.#onBeamUpdate },
      { type: 'click', element: elements.back, handler: this.#onBack },
      { type: 'click', element: elements.recenter, handler: this.#onRecenter },
      { type: 'click', element: elements.redo, handler: this.#redo },
      { type: 'click', element: elements.reset, handler: this.#reset, options: { passive: true } },
      { type: 'click', element: elements.share, handler: this.#onShare },
      { type: 'click', element: elements.undo, handler: this.#undo },
      { type: 'keyup', handler: this.#onKeyup },
      { type: Modifier.Events.Invoked, handler: this.#onModifierInvoked },
      { type: Modifier.Events.Toggled, handler: this.#onModifierToggled },
      { type: 'pointermove', handler: this.#onPointerMove },
      { type: Puzzle.Events.Mask, handler: this.#onMask },
      { type: 'resize', element: window, handler: debounce(this.resize.bind(this)) },
      { type: Stateful.Events.Update, handler: this.#onStateUpdate },
      { type: 'tap', handler: this.#onTap }
    ])
  }

  addModifier (modifier) {
    if (modifier.parent) {
      modifier.parent.addModifier(modifier)
      this.updateSelectedTile(modifier.parent)
    } else {
      this.layout.addModifier(modifier)
      this.#updateModifiers()
    }

    // Update state but don't add a move, since it was the previous move that caused the collision.
    this.updateState()
  }

  centerOn (r, c) {
    const offset = r instanceof OffsetCoordinates ? r : new OffsetCoordinates(r, c)
    const point = this.layout.getPoint(offset)
    View.setCenter(point)
  }

  centerOnImport (id) {
    const imports = this.layout.getImports()
    const ref = imports[id]

    if (ref) {
      const offset = new OffsetCoordinates(ref.offset.r, ref.offset.c)
      this.centerOnTile(offset.r, offset.c)
      return offset
    }
  }

  centerOnTile (r, c) {
    const offset = r instanceof OffsetCoordinates ? r : new OffsetCoordinates(r, c)
    const tile = this.layout.getTile(offset)
    if (tile) {
      View.setCenter(tile.center)
      return tile.equals(this.selectedTile)
    }
  }

  clearDebugPoints () {
    this.layers.debug.clear()
  }

  drawDebugPoint (x, y, style = {}) {
    const circle = new Path.Circle(Object.assign({
      radius: 3,
      fillColor: 'red',
      strokeColor: 'white',
      strokeWidth: 1,
      center: new Point(x, y)
    }, style))
    this.layers.debug.addChild(circle)
  }

  getBeams () {
    return this.layout.getItems()
      .filter((item) => item.type === Item.Types.Terminus)
      .flatMap((terminus) => terminus.beams)
  }

  getBeamsUpdateDelay () {
    return this.#beamsUpdateDelay
  }

  getImport (id) {
    return this.layout.getImports()?.[id]
  }

  getMoves () {
    return this.state.moves()
  }

  getProjectPoint (point) {
    return this.#interact.getProjectPoint(point)
  }

  getShareUrl () {
    // Electron runs on localhost but should use the production web URL
    const shareUrl = new URL(process.env.TARGET === 'electron' ? baseUrl : url)
    const context = State.getContext()
    Game.states.forEach((state) => shareUrl.searchParams.delete(state))
    shareUrl.searchParams.append(context, '')
    // Cloning will flatten current state into original state and get rid of history
    shareUrl.hash = ['', State.getId(), this.state.clone().encode()].join('/')
    return shareUrl.toString()
  }

  getSolution () {
    return base64encode(JSON.stringify(this.getMoves()))
  }

  getTile (point) {
    const result = paper.project.hitTest(point.ceil(), {
      fill: true,
      match: (result) => result.item.data.type === Item.Types.Tile,
      segments: true,
      stroke: true,
      tolerance: 0
    })
    return result ? this.layout.getTile(result.item.data.coordinates.offset) : result
  }

  getTitle () {
    const id = this.state.getId()
    const title = this.state.getTitle()
    return id + (title ? ` - "${title}"` : '')
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

  onError (error, message, cause) {
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

  async reload (state = undefined, options = {}) {
    this.error = false
    document.body.classList.remove(Puzzle.Events.Error)

    if (this.state) {
      if (options.animations?.length) {
        this.layout?.modifiers.forEach((modifier) => modifier.detach())
        // This will prevent any further tearing down of the layout
        this.layout = undefined
      }
      this.teardown()
    }

    if (state instanceof State) {
      // Reset state
      this.state = state
    } else if (typeof state === 'object') {
      // Update current state
      this.state.update(state)
    } else if (state === false) {
      // Re-resolve state
      this.state = State.resolve()
    }

    this.#updateActions()

    try {
      if (options.animations?.includes(Puzzle.Animations.FadeOutBefore)) {
        await fadeOut(this.element)
        this.resetProject(options).cleanup()
        await this.#setup(options)
      } else {
        await this.#setup(options, this.resetProject(options))
      }
    } catch (e) {
      if (typeof options.onError === 'function') {
        options.onError(e)
      } else {
        this.onError(e, 'Puzzle configuration is invalid.')
      }
    }

    emitEvent(Puzzle.Events.Updated, { state: this.state })
  }

  resetProject (options) {
    const element = this.element
    const project = this.project

    if (element) {
      element.classList.remove('active')
    }

    this.#createProject(options)

    function cleanup () {
      if (project) {
        project.clear()
        project.remove()
        element.remove()
      }
    }

    return { cleanup, element, project }
  }

  removeModifier (modifier) {
    if (modifier.parent) {
      modifier.parent.removeModifier(modifier)
    } else {
      this.layout.removeModifier(modifier)
      this.#updateModifiers()
    }

    // Update state but don't add a move, since it was the previous move that caused the collision.
    this.updateState()
  }

  async resize (reload = true, event = true) {
    const { width, height } = elements.wrapper.getBoundingClientRect()
    const newSize = new Size(width, height)
    if (paper.view.viewSize.equals(newSize)) {
      // Nothing to do
      return
    }

    console.debug(Puzzle.toString('resize'), newSize)

    elements.canvas.height = height
    elements.canvas.width = width
    elements.canvas.style.height = height + 'px'
    elements.canvas.style.width = width + 'px'

    paper.view.viewSize = newSize

    this.recenter()

    if (reload && this.state) {
      // For some reason, without reload, setting viewSize alone breaks the project coordinate space
      // See: https://github.com/paperjs/paper.js/issues/1757
      // Forcing a reload fixes it.
      await this.reload()
    }

    if (event) {
      emitEvent(Puzzle.Events.Resized, { newSize })
    }
  }

  async select (id, options) {
    if (typeof id === 'object') {
      options = id
      id = undefined
    }

    if (id !== undefined && id === this.state?.getId()) {
      // This ID is already selected
      return
    }

    await this.reload(State.resolve(id), options)

    id = this.state.getId()

    // Show 'back' button if the loaded puzzle has a parent puzzle
    elements.back.classList.toggle('hide', State.getParent(id) === null)

    // Can't remove puzzles that exist in configuration
    elements.delete.classList.toggle('hide', Puzzles.has(id))
  }

  setMessage (message) {
    elements.headerMessage.textContent = message
  }

  tap (event) {
    if (this.error || this.solved) {
      // Can't tap
      return
    }

    const result = paper.project.hitTest(event.detail.point)

    let tile
    switch (result?.item.data.type) {
      case Item.Types.Mask:
        return
      case Item.Types.Tile:
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

  teardown () {
    this.#isTearingDown = true

    document.body.classList.remove(...Object.values(Puzzle.Events))

    this.#collisions = {}
    this.#maskQueue = []

    this.unmask()
    this.#removeLayers()

    this.layout?.teardown()
    this.layout = undefined
    this.#requirements?.teardown()
    this.#requirements = undefined
    this.solved = false
    this.selectedTile = undefined
    this.#isUpdatingBeams = false
    this.#isTearingDown = false
  }

  unmask () {
    if (!this.#mask) {
      return
    }

    console.debug('unmask', this.#mask)

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
    this.#updateModifiers()

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
    this.#updateActions()

    emitEvent(Puzzle.Events.Updated, { state: this.state })
  }

  #addLayers () {
    this.layers = {}

    // These layers will be added in the order they are defined
    const layers = ['mask', 'collisions', 'debug']
    layers.forEach((name) => {
      this.layers[name] = new Layer({ name })
    })
  }

  #createProject (options = {}) {
    const { width, height } = elements.wrapper.getBoundingClientRect()

    this.element = document.createElement('canvas')

    this.element.className = 'active'
    this.element.height = height
    this.element.width = width
    this.element.style.height = height + 'px'
    this.element.style.width = width + 'px'

    if (options.animations?.includes(Puzzle.Animations.FadeIn)) {
      this.element.classList.add('see-through')
    }

    elements.canvas.append(this.element)

    this.project = new Project(this.element)
    this.project.activate()
  }

  #getModifiers (tile) {
    // Sort by ID to ensure they always appear in the same order regardless of ownership
    return (tile?.modifiers ?? []).concat(this.layout.modifiers)
    // .sort((a, b) => a.id - b.id)
  }

  async #onBack () {
    const id = this.state.getId()
    const parentId = State.getParent(id)

    this.centerOnTile(0, 0)
    await this.select(parentId, { animations: [Puzzle.Animations.FadeIn] })
  }

  #onBeamUpdate (event) {
    if (this.#isTearingDown) {
      return
    }

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

  #onKeyup (event) {
    if (this.debug && event.key === 's') {
      this.update()
    }
  }

  #onMask (event) {
    console.debug('Mask event', event)
    this.mask(event.detail.mask)
  }

  async #onModifierInvoked (event) {
    const modifier = event.detail.modifier
    const tile = event.detail.tile

    const selectedTile = event.detail.selectedTile

    if (modifier.isStuck(tile)) {
      this.layout.removeModifier(modifier)
      modifier.move(tile)
      console.debug('Modifier is stuck to tile', modifier, tile)
      if (!selectedTile) {
        this.#updateModifiers()
      }
    }

    if (selectedTile) {
      this.updateSelectedTile(selectedTile)
    }

    await modifier.onInvoked(this, event)

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
    if (!event.target.matches('canvas') || !this.debug || params.has(State.ParamKeys.Edit)) {
      return
    }

    const point = this.#interact.getProjectPoint(Interact.point(event))
    const result = paper.project.hitTest(point)

    elements.debug.textContent = ''

    switch (result?.item.data.type) {
      case Item.Types.Tile: {
        const tile = this.layout.getTile(result.item.data.coordinates.offset)
        elements.debug.textContent = tile.toString()
        break
      }
    }
  }

  #onRecenter () {
    View.setZoom(1)
    this.recenter(true)
  }

  async #onShare () {
    await writeToClipboard(this.getShareUrl())
    tippy.show()
    setTimeout(() => tippy.hide(), 1000)
  }

  #onSolved () {
    if (this.solved) {
      return
    }

    this.solved = true

    this.updateSelectedTile(undefined)
    this.mask(Puzzle.#solvedMask)

    // Store the solution in cache
    this.state.setSolution(this.layout.tiles.filter(this.#mask.tileFilter))

    const p = document.createElement('p')
    p.classList.add(Puzzle.ClassNames.Solved)
    p.textContent = 'Puzzle solved!'

    elements.headerMessage.replaceChildren(p, Icons.Solved.getElement())

    document.body.classList.add(Puzzle.Events.Solved)
    emitEvent(Puzzle.Events.Solved)
  }

  #onStateUpdate (event) {
    console.debug('Puzzle.#onStateUpdate()', event)
    this.updateState()
  }

  #onTap (event) {
    if (params.has(Game.States.Edit)) {
      // Let the editor handle tap events
      return
    }

    return this.tap(event)
  }

  async #redo () {
    if (this.state.redo()) {
      await this.reload()
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
    if (!this.state.canReset()) {
      return
    }

    confirm('Are you sure you want to reset this puzzle? This cannot be undone.', () => {
      this.state.reset()
      setTimeout(async () => await this.reload())
    })
  }

  async #setup (options, project = { cleanup: () => {} }) {
    const { layout, message, requirements } = this.state.getCurrent()

    await this.resize(false)

    this.state.setSolution([])
    State.add(this.state.getId())

    this.layout = new Layout(layout)
    this.message = message
    this.#requirements = new Requirements(requirements)

    this.#addLayers()
    Object.values(this.layers).forEach((layer) => paper.project.addLayer(layer))

    const selectedTileId = this.state.getSelectedTile()
    const selectedTile = selectedTileId
      ? this.layout.getTile(new OffsetCoordinates(...selectedTileId.split(',')))
      : undefined

    // TODO https://github.com/kflorence/beaming/issues/71
    // this.#updateDetails()
    this.#updateDropdown()
    this.updateSelectedTile(selectedTile)
    this.updateState()
    this.update()

    if (options.animations?.includes(Puzzle.Animations.FadeIn)) {
      await fadeIn(this.element)
    }

    if (options.animations?.includes(Puzzle.Animations.FadeOutAfter)) {
      await fadeOut(project.element)
    }

    // If the old canvas hasn't been cleaned up yet, do it now
    project.cleanup()

    document.body.classList.add(Puzzle.Events.Loaded)
  }

  async #undo () {
    if (this.state.undo()) {
      await this.reload()
    }
  }

  #updateActions () {
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

    addClass(Puzzle.ClassNames.Disabled, ...disable)
  }

  #updateDetails () {
    const id = this.state.getId()
    const author = this.state.getAuthor()
    const title = this.state.getTitle()
    const hide = !(author || title)

    elements.infoAuthor.textContent = `Created by: ${author}`
    elements.info.classList.toggle('hide', hide)
    elements.info.setAttribute('open', (!hide).toString())
    elements.infoId.textContent = `Puzzle: ${id}`
    elements.infoTitle.textContent = `Title: "${title}"`
  }

  #updateDropdown () {
    if (params.has(Game.States.Edit)) {
      // The editor will handle the dropdown
      return
    }

    elements.select.replaceChildren()

    // TODO: once levels are implemented, this should just use State.getIds()
    const ids = Array.from(new Set(Puzzles.ids.concat(State.getIds())))
    const customIds = []
    ids.forEach((id) => {
      if (Puzzles.has(id)) {
        appendOption(elements.select, { value: id, text: Puzzles.titles[id] })
      } else {
        customIds.push(id)
      }
    })

    if (customIds.length) {
      const customGroup = document.createElement('optgroup')
      customGroup.label = '———'
      customIds.forEach((id) => {
        appendOption(customGroup, { value: id, text: State.fromCache(id)?.getTitle() || id })
      })

      elements.select.append(customGroup)
    }

    // Select current ID
    elements.select.value = this.state?.getId()
  }

  #updateBeams () {
    const beams = this.getBeams().filter((beam) => beam.isPending())

    if (!beams.length) {
      this.#isUpdatingBeams = false

      // Ensure we check for a solution after all other in-progress events have processed
      setTimeout(() => {
        if (this.#requirements.areMet()) {
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
    elements.footerMessage.replaceChildren()

    if (tile) {
      const puzzleModifier = tile.modifiers.find((modifier) => modifier.type === Modifier.Types.Puzzle)
      if (puzzleModifier) {
        elements.footerMessage.textContent = `Puzzle '${puzzleModifier.getState().puzzleId}'`
      } else {
        // Check to see if tile has any color elements that need to be displayed
        // Note: these will only be displayed if the tile contains an item with more than one color
        const colorElements = tile.items
          .map((item) => item.getColorElements(tile))
          .find((colorElements) => colorElements.length > 1) || []
        if (colorElements.length) {
          const container = document.createElement('div')
          container.classList.add('colors')
          container.replaceChildren(...colorElements)
          elements.footerMessage.replaceChildren(container)
        }
      }
    }

    elements.headerMessage.textContent = this.message
  }

  #updateModifiers () {
    this.modifiers.forEach((modifier) => modifier.detach())
    this.modifiers = this.#getModifiers(this.selectedTile)
    this.modifiers.forEach((modifier) => modifier.attach(this.selectedTile))

    elements.footer.classList.toggle(Puzzle.ClassNames.Active, this.modifiers.length > 0)
  }

  // Filters for all beams that are connected to the terminus, or have been merged into a beam that is connected
  static #connectedBeams = (item) => item.type === Item.Types.Beam && item.isConnected()

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

  static Animations = Object.freeze({
    FadeIn: 'fade-in',
    FadeOutAfter: 'fade-out-after',
    FadeOutBefore: 'fade-out-before'
  })

  static ClassNames = Object.freeze({
    Active: 'active',
    Disabled: 'disabled',
    Icon: 'icon',
    Solved: 'solved'
  })

  static Events = Object.freeze({
    Error: 'puzzle-error',
    Loaded: 'puzzle-loaded',
    Mask: 'puzzle-mask',
    Resized: 'puzzle-resized',
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

  static schema = () => Object.freeze({
    $id: Schema.$id('puzzle'),
    properties: {
      id: {
        readOnly: true,
        type: 'string'
      },
      author: {
        maxLength: 72,
        type: 'string'
      },
      title: {
        maxLength: 72,
        type: 'string'
      },
      description: {
        format: 'textarea',
        maxLength: 144,
        type: 'string'
      },
      layout: Layout.schema(),
      requirements: Requirements.schema(),
      version: {
        default: 0,
        type: 'number'
      }
    },
    required: [
      'id',
      'layout',
      'version'
    ],
    title: 'Puzzle',
    type: 'object'
  })

  static toString = classToString('Puzzle')
}
