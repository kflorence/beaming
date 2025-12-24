import { merge } from './util.js'
import { Schema } from './schema.js'

export class Filter {
  name
  state
  type

  constructor (state) {
    this.name = state.name
    this.state = state
    this.type = state.type
  }

  apply () {}

  static Name
  static Schema
  static Type

  static factory (state) {
    throw new Error(`Factory not implemented for ${state.type}, ${state.name}!`)
  }

  static schema (path, type, name) {
    return merge(Schema.typed(Schema.$id('filter', path), type, name), {
      properties: {
        name: {
          const: name,
          options: {
            hidden: true
          }
        }
      },
      required: ['name'],
      title: [type, name].map((s) => s.toLowerCase().replaceAll('-', ' ')).join(' ')
    })
  }
}
