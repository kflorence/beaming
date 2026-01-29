import { classToString, getTextElement, merge } from './util'
import { Terminus } from './items/terminus'
import { EventListeners } from './eventListeners'
import { Puzzle } from './puzzle'
import { Schema } from './schema'
import { Icons } from './icon.js'

const element = document.getElementById('puzzle-requirements')

class Requirement {
  constructor (state, elements) {
    this.state = state

    const li = document.createElement('li')
    li.append(...elements)
    element.append(li)
  }

  isMet () {}

  teardown () {}

  update () {}

  static Types = Object.freeze({
    Connections: 'connections',
    Moves: 'moves'
  })

  static schema (type) {
    return Schema.typed('requirement', type)
  }
}

export class Requirements {
  #requirements = []

  constructor (state = []) {
    state.forEach((condition) => this.#factory(condition))
  }

  teardown () {
    this.#requirements.forEach((requirement) => requirement.teardown())
    element.replaceChildren()
  }

  areMet () {
    return this.#requirements.length > 0 && this.#requirements.every((requirement) => requirement.isMet())
  }

  #factory (state) {
    switch (state.type) {
      case Requirement.Types.Connections: {
        this.#requirements.push(new ConnectionsRequirement(state))
        break
      }
      case Requirement.Types.Moves: {
        this.#requirements.push(new MovesRequirement(state))
        break
      }
      default: {
        console.warn('Ignoring requirement with unknown type:', state.type)
        break
      }
    }
  }

  static schema = () => Object.freeze({
    $id: Schema.$id('requirements'),
    items: {
      anyOf: [ConnectionsRequirement.schema(), MovesRequirement.schema()],
      headerTemplate: 'requirement {{i1}}'
    },
    type: 'array'
  })
}

class ConnectionsRequirement extends Requirement {
  #completed
  #eventListeners = new EventListeners({ context: this })
  #connections = []

  constructor (state) {
    const completed = document.createElement('span')
    completed.textContent = '0'

    const required = document.createElement('span')
    required.textContent = state.amount.toString()

    const elements = [
      completed,
      getTextElement('/'),
      required,
      Icons.Connections.getElement()
    ]

    super(state, elements)

    this.#completed = completed

    this.#eventListeners.add([
      { type: Terminus.Events.Connection, handler: this.update },
      { type: Terminus.Events.Disconnection, handler: this.update }
    ])
  }

  isMet () {
    return this.#connections.length === this.state.amount
  }

  teardown () {
    this.#eventListeners.remove()
    super.teardown()
  }

  update (event) {
    const terminus = event.detail.terminus
    const opening = event.detail.opening
    const connectionId = `${terminus.id}:${opening.direction}`
    const connectionIndex = this.#connections.findIndex((connection) => connection === connectionId)

    if (opening.connected && connectionIndex < 0) {
      this.#connections.push(connectionId)
    } else if (!opening.connected && connectionIndex >= 0) {
      this.#connections.splice(connectionIndex, 1)
    }

    this.#completed.textContent = this.#connections.length.toString()
  }

  static schema = () => Object.freeze(merge(Requirement.schema(Requirement.Types.Connections), {
    properties: {
      amount: {
        minimum: 0,
        type: 'number'
      }
    },
    required: ['amount']
  }))

  static toString = classToString('ConnectionsRequirement')
}

class MovesRequirement extends Requirement {
  #completed
  #eventListeners = new EventListeners({ context: this })
  #moves = 0

  constructor (state) {
    state.operator ??= MovesRequirement.Operators.equalTo

    if (!Object.values(MovesRequirement.Operators).includes(state.operator)) {
      throw new Error(`Invalid MovesRequirement operator: ${state.operator}`)
    }

    const completed = document.createElement('span')
    completed.textContent = '0'

    const required = document.createElement('span')
    required.textContent = state.amount.toString()

    const elements = [
      completed,
      getTextElement(state.operator),
      required,
      Icons.Moves.getElement()
    ]

    super(state, elements)

    this.#completed = completed
    this.#eventListeners.add([{ type: Puzzle.Events.Updated, handler: this.update }])
  }

  isMet () {
    // TODO: support 'between' syntax like 2 < 3 < 4 ?
    switch (this.state.operator) {
      case MovesRequirement.Operators.equalTo:
        return this.#moves === this.state.amount
      case MovesRequirement.Operators.greaterThan:
        return this.#moves > this.state.amount
      case MovesRequirement.Operators.lessThan:
        return this.#moves < this.state.amount
    }
  }

  teardown () {
    this.#eventListeners.remove()
    super.teardown()
  }

  update (event) {
    const moves = event.detail.state.moves()
    this.#moves = moves.length
    this.#completed.textContent = this.#moves.toString()
  }

  static Operators = Object.freeze({
    equalTo: '=',
    greaterThan: '>',
    lessThan: '<'
  })

  static schema = () => Object.freeze(merge(Requirement.schema(Requirement.Types.Moves), {
    properties: {
      amount: {
        minimum: 0,
        type: 'number'
      },
      operator: {
        enum: Object.values(MovesRequirement.Operators),
        type: 'string'
      }
    },
    required: ['amount']
  }))

  static toString = classToString('MovesRequirement')
}
