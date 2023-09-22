import { Terminus } from '../components/items/terminus'
import { Lock } from '../components/modifiers/lock'
import { Rotate } from '../components/modifiers/rotate'
import { Reflector } from '../components/items/reflector'
import { Toggle } from '../components/modifiers/toggle'

export default {
  connectionsRequired: 2,
  layout: {
    tiles: [
      [
        null,
        null,
        {
          items: [
            {
              // TODO: terminus can contain a modifier that the user can acquire by connecting a beam.
              // On acquisition, the modifier must be placed on a valid tile.
              // While a terminus contains a modifier, it cannot be activated.
              //contains: { type: Key.Type },
              modifiers: [{ type: Lock.Type }, { type: Toggle.Type }],
              openings: [{ color: 'blue', direction: 3 }, { direction: 4 }],
              type: Terminus.Type
            }
          ]
        },
        null,
        null
      ],
      [
        null,
        {},
        {},
        null,
        null
      ],
      [
        null,
        {
          items: [
            {
              direction: 3,
              modifiers: [{ type: Lock.Type }, { type: Rotate.Type }],
              type: Reflector.Type
            }
          ]
        },
        null,
        {
          items: [
            {
              direction: 3,
              modifiers: [{ type: Lock.Type }, { type: Rotate.Type }],
              type: Reflector.Type
            }
          ]
        },
        null
      ],
      [
        null,
        {},
        {},
        null,
        null
      ],
      [
        null,
        null,
        {
          items: [
            {
              modifiers: [{ type: Lock.Type }, { type: Toggle.Type }],
              openings: [{ color: 'blue', direction: 0 }, { color: 'blue', direction: 1 }],
              type: Terminus.Type
            }
          ]
        },
        null,
        null
      ]
    ]
  },
  title: 'Two'
}
