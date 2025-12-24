import { Schema } from './schema.js'
import { OffsetCoordinates } from './coordinates/offset.js'
import { merge } from './util.js'
import { Filter } from './filter.js'

export class ImportFilter extends Filter {
  static factory (state) {
    switch (true) {
      case (state.type === ImportFilter.Types.Condition && state.name === ImportFilter.Names.Solved): {
        return new ImportFilterConditionSolved(state)
      }
      case (state.type === ImportFilter.Types.Tile && state.name === ImportFilter.Names.InSolution): {
        return new ImportFilterTileInSolution(state)
      }
      default: {
        throw new Error(`Unknown filter: ${state.type}, ${state.name}.`)
      }
    }
  }

  static schema (type, name) {
    return super.schema('import', type, name)
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
    return this.state.solved === (state.getSolution() !== undefined)
  }

  static Name = ImportFilter.Names.Solved
  static Type = ImportFilter.Types.Condition

  // This filter will include/exclude the import based on whether the imported puzzle has been solved
  static Schema = Object.freeze(merge(
    ImportFilter.schema(this.Type, this.Name),
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
    return this.state.inSolution === state.getSolution().includes(offset.toString())
  }

  static Name = ImportFilter.Names.InSolution
  static Type = ImportFilter.Types.Tile

  // This filter will include/exclude tiles based on whether they are included in the puzzle solution
  static Schema = Object.freeze(merge(
    ImportFilter.schema(this.Type, this.Name),
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
        description: 'Cache the imported puzzle in the current puzzle configuration. ' +
          'This should be set to true when importing non-official puzzles.',
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
      },
      seen: {
        description: 'Mark the import as seen by the user. This should only be used for testing purposes.',
        type: 'boolean'
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
