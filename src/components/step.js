import chroma from 'chroma-js'
import { deepEqual } from './util'

export class Step {
  color
  colors
  direction
  onAdd
  onRemove
  point
  pathIndex
  segmentIndex
  state
  tile

  constructor (tile, colors, direction, point, pathIndex, segmentIndex, state, onAdd, onRemove) {
    this.colors = Array.isArray(colors) ? Array.from(colors) : [colors]

    if (this.colors.length) {
      this.color = chroma.average(this.colors).hex()
    }

    this.direction = direction
    this.onAdd = onAdd
    this.onRemove = onRemove
    this.point = point
    this.pathIndex = pathIndex
    this.segmentIndex = segmentIndex
    this.state = state || new StepState()
    this.tile = tile
  }

  copy (settings) {
    return new Step(
      settings.tile || this.tile,
      settings.colors || settings.color || this.colors,
      settings.direction || this.direction,
      settings.point || this.point,
      settings.pathIndex || this.pathIndex,
      settings.segmentIndex || this.segmentIndex,
      settings.state,
      settings.onAdd,
      settings.onRemove
    )
  }

  equals (step) {
    return deepEqual(this, step)
  }

  static Stop = class StepStop extends Step {
    constructor () {
      super(null, [], null, null, null, null)
    }
  }
}

export class StepState {
  #settings = []

  // TODO: move these to step
  disconnectPath = false
  done = false
  insertAbove

  constructor () {
    this.#settings = Array.from(arguments)
    this.#settings.map((settings) => Object.assign({}, settings)).forEach((settings) => {
      if (settings.namespace) {
        this[settings.namespace] = settings
      } else {
        Object.keys(settings).forEach((key) => {
          this[key] = settings[key]
        })
      }
    })
  }

  copy (...settings) {
    return new StepState(...(this.#settings.concat(settings)))
  }

  get (Class) {
    const settings = this.#settings.filter((state) => state instanceof Class)
    if (settings.length) {
      return Object.assign({}, ...settings)
    }
  }

  has (Class) {
    return this.#settings.some((settings) => settings instanceof Class)
  }

  static Collision = class StepCollision {
    item
    namespace = 'collision'
    point

    // Item is optional, in the case of an out-of-bounds collision for example
    constructor (point, item) {
      this.point = point
      this.item = item
    }

    static from (collision) {
      return new StepCollision(collision.points[0], collision.item)
    }
  }

  static Filter = class StepFilter {}

  static MergeInto = class StepMergeInto {
    beam
    namespace = 'mergeInto'

    constructor (beam) {
      this.beam = beam
    }
  }

  static MergeWith = class StepMergeWith {
    beams
    namespace = 'mergeWith'

    constructor (beams) {
      this.beams = Array.isArray(beams) ? Array.from(beams) : [beams]
    }
  }

  static Portal = class StepPortal {
    entryPortal
    exitPortal
    namespace = 'portal'

    constructor (entryPortal, exitPortal) {
      this.entryPortal = entryPortal
      this.exitPortal = exitPortal
    }
  }

  static Reflector = class StepReflector {}

  static TerminusConnection = class StepTerminusConnection {
    namespace = 'terminusConnection'

    constructor (terminus, opening) {
      this.terminus = terminus
      this.opening = opening
    }
  }
}
