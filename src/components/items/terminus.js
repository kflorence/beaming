import chroma from 'chroma-js'
import { Path } from 'paper'
import { toggleable } from '../modifiers/toggle'
import { Item } from '../item'
import { rotatable } from '../modifiers/rotate'
import {
  getColorElements,
  emitEvent,
  getOppositeDirection,
  addDirection,
  subtractDirection,
  merge, uniqueBy
} from '../util'
import { Beam } from './beam'
import { movable } from '../modifiers/move'
import { StepState } from '../step'
import { Schema } from '../schema'

export class Terminus extends movable(rotatable(toggleable(Item))) {
  sortOrder = 2

  #ui

  constructor (tile, state) {
    super(...arguments)

    state.openings ??= []
    state.openings = uniqueBy('direction', state.openings)

    const colors = state.openings.filter((opening) => opening?.color)
      .flatMap((opening) => Array.isArray(opening.color) ? opening.color : [opening.color])

    if (!colors.length && !state.color) {
      throw new Error('Color must be defined on terminus or opening: ' + this.toString())
    }

    const color = chroma.average(
      colors.length ? colors : (Array.isArray(state.color) ? state.color : [state.color])
    ).hex()

    const openings = state.openings.map((opening, index) =>
      new Terminus.Opening(
        index,
        opening.color ?? color,
        opening.direction,
        opening.connected,
        opening.toggled ?? state.toggled
      ))

    this.#ui = Terminus.ui(tile, color, openings)

    this.group.addChildren([...this.#ui.openings, this.#ui.terminus])

    this.color = color
    this.openings = openings
    this.radius = this.#ui.radius
    this.toggled = openings.some((opening) => opening.toggled)

    // Needs to be last since it references 'this'
    this.beams = openings.map((opening) => new Beam(this, opening))

    this.update()
  }

  getColorElements () {
    return getColorElements(this.openings.map((opening) => opening.color))
  }

  getOpening (direction) {
    return this.openings.find((opening) => opening.direction === direction)
  }

  onMove () {
    this.beams.forEach((beam) => beam.remove())
  }

  onCollision ({ beam, collisionStep, currentStep, existingNextStep, nextStep }) {
    console.debug(this.toString(), 'collision', beam.toString())

    // Colliding with the starting terminus, ignore
    if (beam.parent === this && beam.startDirection() === nextStep.direction) {
      console.debug(beam.toString(), 'ignoring starting terminus collision')
      return
    }

    const directionFrom = getOppositeDirection(currentStep.direction)

    // Take rotation of terminus into account
    const opening = this.openings.find((opening) => this.getDirection(opening.direction) === directionFrom)
    if (
      opening && opening.color === nextStep.color && (
        !opening.toggled ||
        // When re-evaluating history of an already connected opening
        (opening.connected && existingNextStep?.state.get(StepState.TerminusConnection)?.terminus.equals(this))
      )
    ) {
      // Beam has connected to a valid opening
      console.debug(beam.toString(), 'terminus connection', this.toString(), opening)
      return nextStep.copy({
        done: true,
        onAdd: () => {
          nextStep.onAdd()
          this.onConnection(opening.direction)
        },
        onRemove: () => {
          nextStep.onRemove()
          this.onDisconnection(opening.direction)
        },
        state: nextStep.state.copy(new StepState.TerminusConnection(this, opening))
      })
    }

    // Otherwise, treat this as a collision
    return collisionStep
  }

  onConnection (direction) {
    const opening = this.getOpening(direction)

    if (opening.connected) {
      // Already connected
      return
    }

    opening.connect()
    this.update()

    emitEvent(Terminus.Events.Connection, { terminus: this, opening })
  }

  onDisconnection (direction) {
    const opening = this.getOpening(direction)

    if (!opening.connected) {
      // Already disconnected
      return
    }

    opening.disconnect()
    this.update()

    emitEvent(Terminus.Events.Disconnection, { terminus: this, opening })
  }

  onToggle () {
    this.updateState((state) => {
      this.openings.filter((opening) => !opening.connected).forEach((opening) => {
        opening.toggle()
        state.openings[opening.index].toggled = opening.toggled
      })
    })
    this.update()
  }

  update () {
    this.beams.forEach((beam) => {
      const opening = beam.getOpening()
      const item = this.#ui.openings.find((item) => item.data.direction === opening.direction)
      item.opacity = opening.toggled ? 1 : Terminus.#openingOffOpacity
    })
  }

  static #openingOffOpacity = 0.3

  static ui (tile, color, configuration) {
    const radius = tile.parameters.circumradius / 2

    const terminus = new Path.RegularPolygon({
      center: tile.center,
      fillColor: color,
      opacity: 1,
      sides: 6,
      radius: radius / 2
    })

    const openings = configuration.map((opening) => {
      const direction = opening.direction

      // Each opening is essentially a triangle from the mid-point segments of the terminus with the tip of the triangle
      // pointing in the direction of the opening. This ensures there isn't a gap between the opening triangle and the
      // terminus hexagon.
      const p1 = terminus.segments[subtractDirection(direction, 1)].point
      const p2 = terminus.segments[addDirection(direction, 2)].point

      const vector = p2.subtract(p1)

      vector.angle += 120

      const p3 = p1.subtract(vector)

      return new Path({
        closed: true,
        data: { collidable: false, direction },
        fillColor: opening.color,
        opacity: opening.toggled ? 1 : Terminus.#openingOffOpacity,
        segments: [p1, p2, p3]
      })
    })

    return { openings, radius, terminus }
  }

  static Opening = class {
    color
    colors
    connected
    direction
    index
    toggled

    constructor (index, color, direction, connected, toggled) {
      this.index = index
      this.colors = Array.isArray(color) ? color : [color]
      this.color = chroma.average(this.colors).hex()
      this.direction = direction
      this.connected = connected === true
      this.toggled = toggled === true
    }

    connect () {
      this.connected = this.toggled = true
    }

    disconnect () {
      this.connected = this.toggled = false
    }

    toggle () {
      this.toggled = !this.toggled
    }

    static Schema = Object.freeze({
      $id: Schema.$id('terminus', 'opening'),
      headerTemplate: 'opening {{i1}}',
      properties: {
        color: Schema.color,
        direction: Schema.direction,
        toggled: {
          type: 'boolean'
        }
      },
      required: ['direction'],
      type: 'object'
    })
  }

  static Events = Object.freeze({
    Connection: 'terminus-connection',
    Disconnection: 'terminus-disconnection'
  })

  static Schema = Object.freeze(merge([
    Item.schema(Item.Types.terminus),
    movable.Schema,
    rotatable.Schema,
    toggleable.Schema,
    {
      properties: {
        color: Schema.color,
        openings: {
          items: Terminus.Opening.Schema,
          type: 'array'
        }
      }
    }
  ]))
}
