import { Schema } from './schema.js'
import { OffsetCoordinates } from './coordinates/offset.js'
import { merge } from './util.js'

export class ImportFilter {
  id
  name
  state
  type

  constructor (state) {
    this.name = state.name
    this.state = state
    this.type = state.type
    this.id = Schema.$id(this.type, this.name)
  }

  apply (state) {}

  static factory (state) {
    const id = Schema.$id(state.type, state.name)
    switch (id) {
      case ImportFilterConditionSolved.Id: {
        return new ImportFilterConditionSolved(state)
      }
      case ImportFilterTileInSolution.Id: {
        return new ImportFilterTileInSolution(state)
      }
      default: {
        throw new Error(`Unknown filter: ${id}.`)
      }
    }
  }

  static schema (type, name) {
    return merge(Schema.typed('import-filter', type, name), {
      properties: {
        name: {
          const: name,
          options: {
            hidden: true
          }
        }
      },
      required: ['name']
    })
  }

  static Names = Object.freeze({
    InSolution: 'in-solution',
    Solved: 'solved'
  })

  static Types = Object.freeze({
    Condition: 'condition',
    Tile: 'tile'
  })
}

export class ImportFilterConditionSolved extends ImportFilter {
  apply (state) {
    const solution = state.getSolution()
    return (this.state.solved === true && solution !== undefined) ||
      (this.state.solved === false && solution === undefined)
  }

  static Id = Schema.$id(ImportFilter.Types.Condition, ImportFilter.Names.Solved)

  // This filter will include/exclude the import based on whether the imported puzzle has been solved
  static Schema = Object.freeze(merge(
    ImportFilter.schema(ImportFilter.Types.Condition, ImportFilter.Names.Solved),
    {
      properties: {
        solved: {
          type: 'boolean'
        }
      },
      required: ['solved']
    }
  ))
}

export class ImportFilterTileInSolution extends ImportFilter {
  apply (state, offset, tile) {
    return state.getSolution().includes(offset.toString())
  }

  static Id = Schema.$id(ImportFilter.Types.Tile, ImportFilter.Names.InSolution)

  // This filter will include/exclude tiles based on whether they are included in the puzzle solution
  static Schema = Object.freeze(merge(
    ImportFilter.schema(ImportFilter.Types.Tile, ImportFilter.Names.InSolution),
    {
      properties: {
        inSolution: {
          type: 'boolean'
        }
      },
      required: ['inSolution']
    }
  ))
}

export class Import {
  static Schema = Object.freeze({
    $id: Schema.$id('import'),
    headerTemplate: 'import {{i1}}',
    properties: {
      id: {
        minLength: 3,
        type: 'string'
      },
      offset: OffsetCoordinates.Schema,
      cache: {
        default: true,
        type: 'boolean'
      },
      color: Schema.color,
      filters: {
        items: {
          anyOf: [
            ImportFilterConditionSolved.Schema,
            ImportFilterTileInSolution.Schema
          ],
          headerTemplate: 'filter {{i1}}'
        },
        type: 'array'
      }
    },
    required: ['id', 'offset'],
    type: 'object'
  })
}

export class Imports {
  static Schema = Object.freeze({
    $id: Schema.$id('imports'),
    items: Import.Schema,
    type: 'array'
  })
}
