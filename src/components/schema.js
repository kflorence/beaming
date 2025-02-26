export class Schema {
  static $id () {
    // Can't use forward slash here:
    // https://github.com/json-editor/json-editor/issues/1648
    return Array.from(arguments).map((arg) => arg.toLowerCase()).join('-')
  }

  static $ref (id) {
    return { $ref: `#/definitions/${id}` }
  }

  static color = {
    format: 'color',
    type: 'string'
  }

  static direction = {
    enum: [0, 1, 2, 3, 4, 5],
    options: {
      enum_titles: ['Northwest', 'Northeast', 'East', 'Southeast', 'Southwest', 'West']
    },
    type: 'number'
  }

  static typed (path, type) {
    return {
      $id: Schema.$id(path, type),
      properties: {
        type: {
          const: type,
          options: {
            containerAttributes: {
              class: 'hide'
            }
          },
          readOnly: true,
          type: 'string'
        }
      },
      required: ['type'],
      title: type,
      type: 'object'
    }
  }
}
