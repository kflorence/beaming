import { Schema } from './schema.js'
import { OffsetCoordinates } from './coordinates/offset.js'

export class Import {
  static Schema = Object.freeze({
    $id: Schema.$id('import'),
    headerTemplate: 'puzzle {{i1}}',
    properties: {
      cache: {
        options: {
          hidden: true
        },
        type: 'string'
      },
      // TODO consider adding conditions and filters
      id: {
        minLength: 3,
        type: 'string'
      },
      offset: OffsetCoordinates.Schema,
      color: Schema.color
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
