import chroma from 'chroma-js'
import { deepEqual } from './util'

export class Step {
  color
  colors
  connected
  direction
  done
  insertAbove
  onAdd
  onRemove
  point
  pathIndex
  projection
  segmentIndex
  state
  tile

  constructor (
    tile,
    colors,
    direction,
    point,
    pathIndex,
    segmentIndex,
    projection,
    connected,
    insertAbove,
    done,
    state,
    onAdd,
    onRemove
  ) {
    if (state && !(state instanceof StepState)) {
      throw new Error('Step.state must be instance of StepState')
    }

    this.colors = Array.isArray(colors) ? Array.from(colors) : [colors]

    if (this.colors.length) {
      this.color = chroma.average(this.colors).hex()
    }

    this.connected = connected ?? true
    this.direction = direction
    this.done = done ?? false
    this.insertAbove = insertAbove
    this.onAdd = onAdd
    this.onRemove = onRemove
    this.point = point
    this.pathIndex = pathIndex
    this.projection = projection ?? false
    this.segmentIndex = segmentIndex
    this.state = state ?? new StepState()
    this.tile = tile
  }

  copy (settings) {
    return new Step(
      settings.tile ?? this.tile,
      settings.colors ?? settings.color ?? this.colors,
      settings.direction ?? this.direction,
      settings.point ?? this.point,
      settings.pathIndex ?? this.pathIndex,
      settings.segmentIndex ?? this.segmentIndex,
      settings.projection ?? this.projection,
      settings.connected ?? this.connected,
      settings.insertAbove ?? this.insertAbove,
      settings.done ?? this.done,
      settings.state ?? new StepState(this.state),
      settings.onAdd ?? this.onAdd,
      settings.onRemove ?? this.onRemove
    )
  }

  equals (step) {
    return deepEqual(this, step)
  }

  static Stop = class StepStop extends Step {
    done = true
    constructor () {
      super(null, [])
    }
  }
}

export class StepState {
  #cache = {}

  constructor () {
    const settings = Object.assign({}, ...arguments)
    Object.keys(settings).forEach((key) => { this[key] = settings[key] })
  }

  copy (...settings) {
    return new StepState(...([this].concat(settings)))
  }

  get (Class) {
    const values = this.#keys(Class).map((key) => this[key]).filter((value) => value)
    if (values.length) {
      return Object.assign({}, ...values)
    }
  }

  has (Class) {
    return this.#keys(Class).some((key) => this[key])
  }

  #keys (Class) {
    return (this.#cache[Class.name] ??= Object.keys(Reflect.construct(Class, [])))
  }

  static Collision = class StepCollision {
    collision

    // Item is optional, in the case of an out-of-bounds collision for example
    constructor (point, item) {
      this.collision = { point, item }
    }
  }

  static Filter = class StepFilter {
    filter = {}
  }

  static CollisionLoop = class StepCollisionLoop {
    collisionLoop

    constructor (collisionLoop) {
      this.collisionLoop = collisionLoop
    }
  }

  static MergeInto = class StepMergeInto {
    mergeInto

    constructor (beam) {
      this.mergeInto = { beam }
    }
  }

  static MergeWith = class StepMergeWith {
    mergeWith

    constructor (beams) {
      beams = Array.isArray(beams) ? Array.from(beams) : [beams]
      this.mergeWith = { beams }
    }
  }

  static Portal = class StepPortal {
    portal

    constructor (entryPortal, exitPortal) {
      this.portal = { entryPortal, exitPortal }
    }
  }

  static Reflector = class StepReflector {
    reflector

    constructor (item) {
      this.reflector = { item }
    }
  }

  static TerminusConnection = class StepTerminusConnection {
    terminusConnection

    constructor (terminus, opening) {
      this.terminusConnection = { terminus, opening }
    }
  }
}
