import { Puzzles } from '../puzzles'
import { Storage } from './storage'
import {
  base64decode,
  base64encode,
  classToString, getKey,
  getKeyFactory,
  jsonDiffPatch,
  params,
  uniqueId,
  url
} from './util'

const history = window.history

// TODO: move this class into Puzzle.State
export class State {
  #current
  #deltas
  #id
  #moveIndex
  #moves
  #original
  #selectedTile
  #solution
  #version

  constructor (id, original, deltas, moveIndex, moves, solution, selectedTile, version) {
    if (id === undefined) {
      if (params.has(State.ParamKeys.Edit)) {
        // This will happen when editing a new puzzle in the editor from scratch
        id = uniqueId()
      } else {
        // This shouldn't happen
        throw new Error('Cannot play puzzle without ID')
      }
    } else if (params.has(State.ParamKeys.Edit) && Puzzles.has(id)) {
      // This will happen when editing a puzzle that exists in source configuration
      id = `${id}-${uniqueId()}`
    }

    this.#id = id
    this.#original = original || { id }
    this.#deltas = deltas || []
    this.#moves = moves || []
    this.#moveIndex = moveIndex ?? this.#moves.length - 1
    this.#selectedTile = selectedTile
    this.#solution = solution
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
      this.#moveIndex = this.#moves.length - 1

      console.debug(this.toString(), 'addMove: added move', this.#moveIndex, this.#moves[this.#moveIndex])
    }

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
    return new State(this.#id, this.getCurrent())
  }

  encode () {
    return base64encode(JSON.stringify({
      id: this.#id,
      // If this puzzle exists in code, just cache the version
      original: Puzzles.has(this.#id) ? { version: this.#original.version } : this.#original,
      deltas: this.#deltas,
      moveIndex: this.#moveIndex,
      moves: this.#moves,
      solution: this.#solution,
      selectedTile: this.#selectedTile,
      version: this.#version
    }))
  }

  getAuthor () {
    return this.#current.author
  }

  getConfig () {
    return structuredClone(this.#original)
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

  getSelectedTile () {
    return this.#selectedTile
  }

  getSolution () {
    return this.#solution
  }

  getTitle () {
    return this.#current.title
  }

  moves () {
    return this.#moves.slice(0, this.#moveIndex + 1)
  }

  redo () {
    if (!this.canRedo()) {
      return
    }

    this.#moveIndex++
    this.#resetCurrent()
    this.updateCache()

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
    this.#solution = undefined
    this.#selectedTile = undefined

    State.clearCache(this.getId())

    this.#resetCurrent()
    this.updateCache()

    return true
  }

  setSelectedTile (tile) {
    const id = tile?.coordinates.offset.toString()
    if (this.#selectedTile !== id) {
      this.#selectedTile = id
      this.updateCache()
    }
  }

  setSolution (tiles) {
    this.#solution = tiles.map((tile) => tile.coordinates.offset.toString())
    this.updateCache()
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
    this.#solution = undefined
    this.#resetCurrent()
    this.updateCache()

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

    this.updateCache()
  }

  updateCache () {
    const id = this.getId()
    const data = { id }
    const hashParams = ['', id]

    url.hash = hashParams.join('/')
    history.pushState(data, '', url)
    Storage.set(State.key(), id)
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

  static clearCache (id) {
    Storage.delete(id === undefined ? id : State.key(id))
  }

  static decode (str) {
    if (str) {
      return JSON.parse(base64decode(str))
    }
  }

  static delete (id) {
    if (Puzzles.has(id)) {
      // Can't delete puzzles that exist in configuration
      return
    }

    const ids = State.remove(id)

    // Remove associated puzzle keys from cache
    const baseKeys = State.getBaseKeys()
    Object.keys(Storage.get()).forEach((key) => {
      if (baseKeys.some((base) => key.startsWith(base))) {
        Storage.delete(key)
      }
    })

    // Currently selected puzzle
    if (State.getId() === id) {
      Storage.delete(State.key())

      // Clear URL cache
      url.hash = ''
    }

    return ids
  }

  static fromCache (id) {
    const str = Storage.get(State.key(id)) || Storage.get(getKey(State.ContextKeys.Play, 'puzzle', id))
    if (str) {
      return State.fromEncoded(str)
    }
  }

  static fromConfig (id) {
    if (Puzzles.has(id)) {
      return new State(id, Puzzles.get(id))
    }
  }

  static fromEncoded (str) {
    if (!str) {
      return
    }

    const state = State.decode(str)

    if (!state || state.id === undefined) {
      console.warn('Invalid cache, ignoring.')
      return
    }

    if (state.version !== State.Version) {
      console.warn(
        'Invalidating cache due to version mismatch. ' +
        `Ours: ${State.Version}, theirs: ${state.version}.`
      )
      State.clearCache()
      return
    }

    if (Puzzles.has(state.id)) {
      const original = Puzzles.get(state.id)
      if (original && original.version !== state.original?.version) {
        console.warn(
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
      state.solution,
      state.selectedTile,
      state.version
    )
  }

  static getState (id) {
    return Puzzles.has(id) ? Puzzles.get(id) : State.decode(Storage.get(State.key(id)))
  }

  static getBaseKeys () {
    return Object.freeze(Object.values(State.ScopeKeys).map((scope) => getKey(State.getContext, scope, State.getId)))
  }

  static getContext () {
    if (params.has(State.ParamKeys.Edit)) {
      return State.ContextKeys.Edit
    } else if (params.has(State.ParamKeys.Play)) {
      return State.ContextKeys.Play
    }
  }

  static getId () {
    return Storage.get(State.key())
  }

  static getIds () {
    return JSON.parse(Storage.get(State.key(State.CacheKeys.Ids)) ?? '[]')
  }

  static resolve (id) {
    let values = []

    // Explicit ID will take precedence over other resolution methods
    if (id !== undefined) {
      values.push(id)
    } else {
      // Check each segment of the URL hash (e.g. #/[id]/[encoded_state])
      // Encoded state will take precedence over ID (in case there is a mismatch with local cache)
      values.push(...url.hash.substring(1).split('/').filter((path) => path !== '').reverse())

      // Last active puzzle ID
      const lastId = State.getId()
      if (lastId !== null) {
        values.push(lastId)
      }

      if (values.length === 0 && !params.has(State.ParamKeys.Edit)) {
        // If puzzle is not being edited, fall back to first puzzle ID
        values.push(Puzzles.firstId)
      }
    }

    if (params.has(State.ParamKeys.ClearCache)) {
      // If cache is being cleared, do it before attempting resolution
      State.clearCache(params.get(State.ParamKeys.ClearCache))
    }

    values = [...new Set(values.filter((v) => v !== null && v !== undefined))]
    console.debug('Attempting to resolve locally cached state with values:', values)

    let state
    for (let value of values) {
      if (Puzzles.has(value)) {
        // Value matches ID in puzzle configuration
        id = value
      }

      // Attempt to load from cache using value as ID
      const cached = Storage.get(State.key(value))
      if (cached !== null) {
        value = cached
      }

      try {
        state = State.fromEncoded(value)
        id = state.getId()
        console.debug(`Successfully resolved locally cached state for puzzle ID '${id}'.`, state)
        return state
      } catch (e) {
        console.debug(`Could not decode value: ${value}`, e)
      }

      if (id !== undefined) {
        // We found a valid puzzle ID
        break
      }
    }

    console.debug(`No locally cached state found for puzzle ID '${id}'.`)

    state = State.fromConfig(id)
    if (state) {
      console.debug(`Resolved state for puzzle ID '${id}' from source configuration.`)
    }

    if (!state && !params.has(State.ParamKeys.Edit)) {
      throw new Error(`Could not resolve state for puzzle ID ${id}.`)
    }

    // Return an empty state if all else fails
    return state ?? new State(id)
  }

  static CacheKeys = Object.freeze({
    Id: 'id',
    Ids: 'ids',
    Locked: 'locked',
    Parent: 'parent'
  })

  static ContextKeys = Object.freeze({
    Edit: 'edit',
    Play: 'play'
  })

  static ParamKeys = Object.freeze({
    ClearCache: 'clearCache',
    Edit: 'edit',
    Parents: 'parents',
    Play: 'play'
  })

  static ScopeKeys = Object.freeze({
    Editor: 'editor',
    Puzzle: 'puzzle'
  })

  // This should be incremented whenever the state cache object changes in a way that requires it to be invalidated
  // Use this sparingly as it will reset the state of every puzzle on the users end
  static Version = 7

  static key = getKeyFactory([State.getContext, 'puzzle'])

  static toString = classToString('State')

  static add (id) {
    const ids = Array.from(new Set([...State.getIds(), id]))
    Storage.set(State.key(State.CacheKeys.Ids), JSON.stringify(ids))
    return ids
  }

  static remove (id) {
    const ids = State.getIds()
    const index = ids.indexOf(id)
    ids.splice(index, 1)
    Storage.set(State.key(State.CacheKeys.Ids), JSON.stringify(ids))
    return ids
  }

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
