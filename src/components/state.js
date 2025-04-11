import { Puzzles } from '../puzzles'
import { base64decode, base64encode, getKeyFactory, jsonDiffPatch, params, uniqueId, url } from './util'

const history = window.history
const localStorage = window.localStorage

export class State {
  #current
  #deltas
  #id
  #moveIndex
  #moves
  #original
  #selectedTile
  #version

  constructor (id, original, deltas, moveIndex, moves, selectedTile, version) {
    // When editing a puzzle from cache, append a unique ID
    this.#id = Puzzles.has(id) && params.has(State.ParamKeys.Edit) ? `${id}-${uniqueId()}` : id ?? uniqueId()
    this.#original = original || {}
    this.#deltas = deltas || []
    this.#moves = moves || []
    this.#moveIndex = moveIndex ?? this.#moves.length - 1
    this.#selectedTile = selectedTile
    this.#version = version ?? State.Version

    this.#resetCurrent()
  }

  addMove (eventType, tile, modifier, selectedTile) {
    // Handle moving after an undo (revising history)
    if (this.#moveIndex < this.#moves.length - 1) {
      const deltaIndex = this.getDeltaIndex()

      console.debug(
        this.toString(),
        'addMove: revising history. moves:',
        this.#moves,
        `moveIndex: ${this.#moveIndex}`,
        `deltaIndex: ${deltaIndex}`
      )

      // Remove all deltas after the current one
      this.#deltas.splice(deltaIndex + 1)
      // Remove all moves after the current one
      this.#moves.splice(this.#moveIndex + 1)
    }

    const deltaIndex = this.#deltas.length - 1
    if (this.#moves.some((move) => move.deltaIndex === deltaIndex)) {
      console.debug(this.toString(), `addMove: ignoring duplicate move for deltaIndex ${deltaIndex}.`)
    } else {
      this.#moves.push(new State.Move(deltaIndex, eventType, tile, modifier, selectedTile))
    }

    this.#moveIndex = this.#moves.length - 1

    console.debug(this.toString(), 'addMove: added move', this.#moveIndex, this.#moves[this.#moveIndex])

    return this.#moveIndex
  }

  canRedo () {
    return this.#moveIndex < this.#moves.length - 1
  }

  canReset () {
    return this.#moves.length > 0
  }

  canUndo () {
    return this.#moveIndex >= 0
  }

  /**
   * @returns {State} Creates a clone of state at current point without history
   */
  clone () {
    return new State(this.#id, this.#current)
  }

  encode () {
    return base64encode(JSON.stringify({
      id: this.#id,
      // If this puzzle exists in code, just cache the version
      original: Puzzles.has(this.#id) ? { version: this.#original.version } : this.#original,
      deltas: this.#deltas,
      moveIndex: this.#moveIndex,
      moves: this.#moves,
      selectedTile: this.#selectedTile,
      version: this.#version
    }))
  }

  getAuthor () {
    return this.#current.author
  }

  getCurrent () {
    return structuredClone(this.#current)
  }

  getCurrentJSON () {
    return JSON.stringify(this.getCurrent(), null, 2)
  }

  getDeltaIndex () {
    console.debug(this.toString(), 'getDeltaIndex', this.#moves, this.#moveIndex, this.#deltas.length - 1)
    // If there are no moves, or the user is on the latest move, use the latest delta index
    // Otherwise, use the delta index indicated by the move
    return this.#moveIndex < this.#moves.length - 1
      ? this.#moves[this.#moveIndex + 1].deltaIndex
      : this.#deltas.length - 1
  }

  getDiff (newState) {
    return jsonDiffPatch.diff(this.#current, newState)
  }

  getId () {
    return this.#id
  }

  getTitle () {
    return this.#current.title
  }

  getSelectedTile () {
    return this.#selectedTile
  }

  moves () {
    return this.#moves
  }

  redo () {
    if (!this.canRedo()) {
      return
    }

    this.#moveIndex++
    this.#resetCurrent()
    this.#updateCache()

    return true
  }

  reset () {
    if (!this.canReset()) {
      return
    }

    // Reset to the state prior to the first move
    this.#deltas.splice(this.#moves[0].deltaIndex + 1)
    this.#moveIndex = -1
    this.#moves = []
    this.#selectedTile = undefined

    State.clearCache(this.getId())

    this.#resetCurrent()
    this.#updateCache()

    return true
  }

  setSelectedTile (tile) {
    const id = tile?.coordinates.offset.toString()
    if (this.#selectedTile !== id) {
      this.#selectedTile = id
      this.#updateCache()
    }
  }

  toString () {
    return `[State:${this.#deltas.length - 1}:${this.#moveIndex}]`
  }

  undo () {
    if (!this.canUndo()) {
      return
    }

    console.debug(this.toString(), 'undo', this.#moveIndex)

    this.#moveIndex--
    this.#resetCurrent()
    this.#updateCache()

    return true
  }

  update (newState) {
    const delta = this.getDiff(newState)
    console.debug(this.toString(), 'update', delta)

    if (delta !== undefined) {
      // It seems that the jsondiffpatch library modifies deltas on patch. To prevent that, they will be stored as
      // their stringified JSON representation and parsed before being applied.
      // See:https://github.com/benjamine/jsondiffpatch/issues/34
      this.#deltas.push(JSON.stringify(delta))

      this.#apply(delta)
    }

    this.#updateCache()
  }

  #apply (delta) {
    // Support for deltas stored as stringified JSON in cache
    if (typeof delta === 'string') {
      delta = JSON.parse(delta)
    }
    console.debug(this.toString(), 'apply', delta)
    return jsonDiffPatch.patch(this.#current, delta)
  }

  #resetCurrent () {
    // Start with the original state
    this.#current = structuredClone(this.#original)

    // Then apply every delta until the currently active delta
    const deltaIndex = this.getDeltaIndex()
    console.debug(this.toString(), 'resetCurrent', deltaIndex)
    this.#deltas.filter((delta, index) => index <= deltaIndex).forEach((delta) => this.#apply(delta))
  }

  #updateCache () {
    const id = this.getId()
    const data = { id }
    const hashParams = ['', id]

    if (!hashParams.includes(params.get(State.ParamKeys.ClearCache))) {
      // Include encoded state in URL if cache is not being cleared for this puzzle ID
      data.state = this.encode()
      hashParams.push(data.state)
      localStorage.setItem(State.#key(id), data.state)
    }

    url.hash = hashParams.join('/')
    history.pushState(data, '', url)
    localStorage.setItem(State.#key(State.CacheKeys.Id), id)
  }

  static clearCache (id) {
    if (id) {
      // Clear a single puzzle ID
      localStorage.removeItem(State.#key(id))
    } else {
      localStorage.clear()
    }
  }

  static fromEncoded (state) {
    state = JSON.parse(base64decode(state))

    if (state.id === undefined) {
      console.warn('Invalid cache, ignoring.')
      return
    }

    if (state.version !== State.Version) {
      console.debug(
        'Invalidating cache due to version mismatch. ' +
        `Ours: ${State.Version}, theirs: ${state.version}.`
      )
      State.clearCache()
      return
    }

    if (Puzzles.has(state.id)) {
      const original = Puzzles.get(state.id)
      if (original && original.version !== state.original?.version) {
        console.debug(
          `Invalidating cache for puzzle ${state.id} due to version mismatch. ` +
          `Ours: ${original.version}, theirs: ${state.original?.version}.`
        )
        State.clearCache(state.id)
        return
      }
      state.original = original
    }

    return new State(
      state.id,
      state.original,
      state.deltas,
      state.moveIndex,
      state.moves,
      state.selectedTile,
      state.version
    )
  }

  static fromId (id) {
    return new State(id, Puzzles.get(id))
  }

  static getId () {
    return localStorage.getItem(State.#key(State.CacheKeys.Id))
  }

  static resolve (id) {
    let values = []

    if (id !== undefined) {
      // Explicit ID will take precedence over other resolution methods
      values.push(id)
    }

    // Check each segment of the URL hash (e.g. #/[id]/[encoded_state])
    values.push(...url.hash.substring(1).split('/').filter((path) => path !== ''))

    if (!params.has(State.ParamKeys.Edit)) {
      // If puzzle is not being edited, check last active puzzle ID, falling back to first puzzle ID
      values.push(State.getId() || Puzzles.visible.firstId)
    }

    if (params.has(State.ParamKeys.ClearCache)) {
      // If cache is being cleared, do it before attempting resolution
      State.clearCache(params.get(State.ParamKeys.ClearCache))
    }

    values = [...new Set(values)]
    console.debug('Attempting to resolve cached state with values:', values)

    let state
    for (let value of values) {
      if (Puzzles.has(value)) {
        id = value
        value = localStorage.getItem(State.#key(id))
        if (value === null) {
          // No local storage cache exists for this ID
          break
        }
      }

      try {
        state = State.fromEncoded(value)
        id = state.getId()
        console.debug(`Successfully resolved cached state for puzzle ID '${id}'.`, state)
        return state
      } catch (e) {
        console.debug(`Could not decode value: ${value}`, e)
      }
    }

    console.debug(`No cached state found for puzzle ID '${id}'.`)

    return State.fromId(id)
  }

  static CacheKeys = Object.freeze({
    Editor: 'editor',
    Id: 'id'
  })

  static ParamKeys = Object.freeze({
    ClearCache: 'clearCache',
    Edit: 'edit'
  })

  // This should be incremented whenever the state cache object changes in a way that requires it to be invalidated
  // Use this sparingly as it will reset the state of every puzzle on the users end
  static Version = 6

  static #key = getKeyFactory([
    // Prefix key with 'editor' when in edit mode
    params.has(State.ParamKeys.Edit) ? State.CacheKeys.Editor : undefined,
    'state'
  ].filter((v) => v))

  static Move = class {
    deltaIndex
    eventType
    modifierType
    selectedTile
    tile

    constructor (deltaIndex, eventType, tile, modifier, selectedTile) {
      this.deltaIndex = deltaIndex
      this.eventType = eventType
      this.modifierType = modifier?.type
      this.selectedTile = selectedTile?.coordinates.offset.toString()
      this.tile = tile?.coordinates.offset.toString()
    }
  }
}
