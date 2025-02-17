import { capitalize, getIconElement, getTextElement, merge } from './util'
import { Terminus } from './items/terminus'
import { EventListeners } from './eventListeners'
import { Puzzle } from './puzzle'
import { Schema } from './schema'

export class Solution {
  #conditions = []

  constructor (state = []) {
    state.forEach((condition) => this.#conditionFactory(condition))
  }

  teardown () {
    this.#conditions.forEach((condition) => condition.teardown())
    Solution.element.replaceChildren()
  }

  isSolved () {
    return this.#conditions.every((condition) => condition.isMet())
  }

  #conditionFactory (condition) {
    switch (condition.type) {
      case SolutionCondition.Types.connections: {
        this.#conditions.push(new Connections(condition))
        break
      }
      case SolutionCondition.Types.moves: {
        this.#conditions.push(new Moves(condition))
        break
      }
      default: {
        console.warn('Ignoring condition with unknown type:', condition.type)
        break
      }
    }
  }

  static schema (type) {
    return Schema.typed('solutions', type)
  }

  static element = document.getElementById('solution')
}

class SolutionCondition {
  constructor (state, elements) {
    this.state = state

    const li = document.createElement('li')
    li.append(...elements)
    Solution.element.append(li)
  }

  isMet () {}

  teardown () {}

  update () {}

  static Types = Object.freeze(Object.fromEntries([
    'connections',
    'moves'
  ].map((type) => [type, capitalize(type)])))
}

class Connections extends SolutionCondition {
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
      getIconElement('link', 'Connections')
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
    console.debug('Connections.update', event)

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

  static Schema = Object.freeze(merge(Solution.schema(SolutionCondition.Types.connections), {
    properties: {
      amount: {
        minimum: 0,
        type: 'number'
      }
    },
    required: ['number']
  }))
}

class Moves extends SolutionCondition {
  #completed
  #eventListeners = new EventListeners({ context: this })
  #moves = 0

  constructor (state) {
    state.operator ??= Moves.Operators.equalTo

    if (!Object.values(Moves.Operators).includes(state.operator)) {
      throw new Error(`Invalid moves operator: ${state.operator}`)
    }

    const completed = document.createElement('span')
    completed.textContent = '0'

    const required = document.createElement('span')
    required.textContent = state.amount.toString()

    const elements = [
      completed,
      getTextElement(state.operator),
      required,
      getIconElement('stacks', 'Moves')
    ]

    super(state, elements)

    this.#completed = completed
    this.#eventListeners.add([{ type: Puzzle.Events.Updated, handler: this.update }])
  }

  isMet () {
    // TODO: support 'between' syntax like 2 < 3 < 4 ?
    switch (this.state.operator) {
      case Moves.Operators.equalTo:
        return this.#moves === this.state.amount
      case Moves.Operators.greaterThan:
        return this.#moves > this.state.amount
      case Moves.Operators.lessThan:
        return this.#moves < this.state.amount
    }
  }

  teardown () {
    this.#eventListeners.remove()
    super.teardown()
  }

  update (event) {
    console.debug('Moves.update', event)
    this.#moves = event.detail.state.moves().length
    this.#completed.textContent = this.#moves.toString()
  }

  static Operators = Object.freeze({
    equalTo: '=',
    greaterThan: '>',
    lessThan: '<'
  })

  static Schema = Object.freeze(merge(Solution.schema(SolutionCondition.Types.moves), {
    properties: {
      amount: {
        minimum: 0,
        type: 'number'
      },
      operator: {
        enum: Object.values(Moves.Operators)
      }
    },
    required: ['number']
  }))
}

Solution.Schema = Object.freeze({
  $id: Schema.$id('solution'),
  items: {
    anyOf: [Connections.Schema, Moves.Schema],
    headerTemplate: 'Solution {{i1}}'
  },
  minItems: 1,
  type: 'array'
})
