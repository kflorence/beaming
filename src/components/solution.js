import { capitalize, getIconElement, getTextElement } from './util'
import { Terminus } from './items/terminus'
import { EventListener } from './eventListener'
import { Puzzle } from './puzzle'

export class Solution {
  #conditions = []

  constructor (state) {
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
  #eventListener
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

    this.#eventListener = new EventListener(this, {
      [Terminus.Events.Connection]: this.update,
      [Terminus.Events.Disconnection]: this.update
    })

    this.#eventListener.addEventListeners()
  }

  isMet () {
    return this.#connections.length === this.state.amount
  }

  teardown () {
    this.#eventListener.removeEventListeners()
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
}

class Moves extends SolutionCondition {
  #completed
  #eventListener
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
    this.#eventListener = new EventListener(this, { [Puzzle.Events.Updated]: this.update })
    this.#eventListener.addEventListeners()
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
    this.#eventListener.removeEventListeners()
    super.teardown()
  }

  update (event) {
    console.debug('Moves.update', event)
    this.#moves = event.detail.state.length()
    this.#completed.textContent = this.#moves.toString()
  }

  static Operators = Object.freeze({
    equalTo: '=',
    greaterThan: '>',
    lessThan: '<'
  })
}
