import { Toggle } from '../components/modifiers/toggle'
import { Terminus } from '../components/items/terminus'
import { Lock } from '../components/modifiers/lock'
import { Rotate } from '../components/modifiers/rotate'
import { Reflector } from '../components/items/reflector'
import { Immutable } from '../components/modifiers/immutable'
import { Wall } from '../components/items/wall'

export default {
  connectionsRequired: 1,
  layout: {
    tiles: [
      [
        null,
        null,
        {
          items: [
            {
              color: 'blue',
              modifiers: [{ type: Immutable.Type }],
              openings: [{ direction: 4 }],
              type: Terminus.Type
            }
          ]
        },
        null
      ],
      [
        null,
        {
          items: [
            {
              modifiers: [{ type: Immutable.Type }],
              openings: [1, 4],
              type: Wall.Type
            }
          ]
        },
        null,
        null
      ],
      [
        null,
        {
          items: [
            {
              color: 'blue',
              modifiers: [
                { type: Lock.Type },
                { type: Rotate.Type },
                { type: Toggle.Type }
              ],
              openings: [
                {
                  direction: 1,
                  toggleable: true
                }
              ],
              type: Terminus.Type
            }
          ]
        },
        null,
        null
      ]
    ]
  },
  title: 'On'
}
