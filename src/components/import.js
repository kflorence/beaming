import { Schema } from './schema.js'
import { OffsetCoordinates } from './coordinates/offset.js'
import { merge } from './util.js'
import { Filter } from './filter.js'
import { State } from './state.js'

export class ImportFilter extends Filter {
  static factory (state) {
    switch (true) {
      case (state.type === ImportFilter.Types.Puzzle && state.name === ImportFilter.Names.Solved): {
        return new ImportFilterPuzzleSolved(state)
      }
      case (state.type === ImportFilter.Types.Item && state.name === ImportFilter.Names.Exclusion): {
        return new ImportFilterItemExclusion(state)
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
    Exclusion: 'exclusion',
    InSolution: 'in-solution',
    Solved: 'solved'
  })

  static Types = Object.freeze({
    Puzzle: 'puzzle',
    Item: 'item',
    Tile: 'tile'
  })
}

export class ImportFilterItemExclusion extends ImportFilter {
  apply () {
    return false
  }

  static Name = ImportFilter.Names.Exclusion
  static Type = ImportFilter.Types.Item

  static schema = () => Object.freeze(merge(
    ImportFilter.schema(this.Type, this.Name),
    {
      description: 'Don\'t import items from tiles.',
      options: {
        containerAttributes: { class: 'empty' }
      }
    }
  ))
}

export class ImportFilterPuzzleSolved extends ImportFilter {
  apply (state) {
    return this.state.solved === (state.getSolution() !== undefined)
  }

  static Name = ImportFilter.Names.Solved
  static Type = ImportFilter.Types.Puzzle

  static schema = () => Object.freeze(merge(
    ImportFilter.schema(this.Type, this.Name),
    {
      description: 'Conditionally import the puzzle depending on whether or not the user has solved it.',
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

  static schema = () => Object.freeze(merge(
    ImportFilter.schema(this.Type, this.Name),
    {
      description: 'Conditionally include tiles based on whether they were included in the puzzle solution.',
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
  static schema () {
    const currentId = State.getId()
    const ids = State.getIds().filter((id) => id !== currentId)
    const titles = ids.map((id) => State.fromCache(id)?.getTitle() ?? id)
    return Object.freeze({
      $id: Schema.$id('import'),
      headerTemplate: 'import {{i1}}',
      properties: {
        id: {
          enum: ids,
          minLength: 3,
          options: {
            enum_titles: titles
          },
          type: 'string'
        },
        offset: OffsetCoordinates.schema(),
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
              ImportFilterItemExclusion.schema(),
              ImportFilterPuzzleSolved.schema(),
              ImportFilterTileInSolution.schema()
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
}

export class Imports {
  static schema = () => Object.freeze({
    $id: Schema.$id('imports'),
    items: Import.schema(),
    type: 'array'
  })
}
