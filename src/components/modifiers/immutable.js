import { Modifier } from '../modifier'
import { baseUri } from '../util'

export class Immutable extends Modifier {
  immutable = true
  name = 'block'
  title = 'Immutable'

  static Schema = Object.freeze({
    $id: `${baseUri}/schemas/modifiers/${Modifier.Types.immutable.toLowerCase()}`,
    properties: {
      type: {
        const: Modifier.Types.immutable
      }
    },
    required: ['type'],
    type: 'object'
  })
}
