import { baseUri } from './util'

export class Schema {
  static $id () {
    return `${baseUri}/schemas/${Array.from(arguments).map((arg) => arg.toLowerCase()).join('/')}`
  }

  static typed (path, type) {
    return {
      $id: Schema.$id(path, type),
      additionalProperties: true,
      properties: {
        type: {
          const: type,
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
