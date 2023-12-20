import { deepEqual } from './util'

export class BeamState {
  disconnect
  insertAbove
  isFinal = false
  settings

  constructor () {
    this.settings = Object.assign({}, ...arguments)

    this.insertAbove = this.settings.insertAbove
    this.disconnect = !!this.settings.disconnect
  }

  equals (state) {
    return deepEqual(this.settings, state.settings)
  }

  get (clazz) {
    if (this.is(clazz)) {
      return this
    }
  }

  is (clazz) {
    return this instanceof clazz
  }

  onAdd () {}

  onRemove () {}
}

export class BeamStateCollision extends BeamState {
  isFinal = true

  constructor() {
    super(...arguments)
    this.item = this.settings.item || this.settings.collision?.item
    this.point = this.settings.point || this.settings.collision.points[0]
  }
}

export class BeamStateFiltered extends BeamState {
  constructor (settings) {
    super(settings)
    this.filtered = settings.filtered
  }
}

export class BeamStateMergeInto extends BeamState {
  isFinal = true

  constructor() {
    super(...arguments)
    this.beam = this.settings.beam
  }
}

export class BeamStateMergeWith extends BeamState {
  isFinal = true

  constructor(state) {
    super(...arguments)

    this.beams = []

    if (state.beams) {
      // If previous state was BeamStateMergeWith, include those beams
      this.beams.concat(state.beams)
    }

    if (this.settings.beam) {
      this.beams.push(this.settings.beam)
    } else if (this.settings.beams) {
      this.beams.concat(this.settings.beams)
    }
  }
}

export class BeamStatePortal extends BeamState {
  constructor () {
    super(...arguments)
    this.entry = this.settings.entry
    this.exit = this.settings.exit
  }
}

export class BeamStateReflector extends BeamState {
  constructor() {
    super(...arguments)
  }
}

export class BeamStateTerminus extends BeamState {
  isFinal = true

  constructor() {
    super(...arguments)
    this.terminus = this.settings.terminus
    this.opening = this.settings.opening
  }

  onAdd () {
    super.onAdd()
    this.terminus.onConnection(this.opening.direction)
  }

  onRemove () {
    super.onRemove()
    this.terminus.onDisconnection(this.opening.direction)
  }
}
