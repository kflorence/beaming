import { Modifier } from '../modifier'
import { baseUri } from '../util'

export class Lock extends Modifier {
  immutable = true
  name = 'lock'
  title = 'Locked'

  static Schema = Object.freeze({
    $id: `${baseUri}/schemas/modifiers/${Modifier.Types.lock.toLowerCase()}`,
    properties: {
      type: {
        const: Modifier.Types.lock
      }
    },
    required: ['type'],
    type: 'object'
  })
}
