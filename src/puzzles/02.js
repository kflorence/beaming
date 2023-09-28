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
              color: 'blue',
              openings: [{ direction: 3 }, { direction: 4 }],
              type: Terminus.Type
            }
          ],
          modifiers: [{ type: Lock.Type }]
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
              type: Reflector.Type
            }
          ],
          modifiers: [{ type: Lock.Type }, { type: Rotate.Type }]
        },
        null,
        {
          items: [
            {
              direction: 3,

              type: Reflector.Type
            }
          ],
          modifiers: [{ type: Lock.Type }, { type: Rotate.Type }]
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
              openings: [{ color: 'blue', direction: 0 }, { color: 'blue', direction: 1 }],
              type: Terminus.Type
            }
          ],
          modifiers: [{ type: Lock.Type }, { type: Toggle.Type }]
        },
        null,
        null
      ]
    ]
  },
  title: 'Two'
}
