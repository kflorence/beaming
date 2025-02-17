export class Schema {
  static $id () {
    return Array.from(arguments).map((arg) => arg.toLowerCase()).join('/')
  }

  static $ref (id) {
    return { $ref: `#/definitions/${id}` }
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
