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
              color: '#5187E8',
              openings: [{ direction: 4 }],
              type: Terminus.Type
            }
          ],
          modifiers: [{ type: Immutable.Type }]
        },
        null
      ],
      [
        null,
        {
          modifiers: [{ type: Immutable.Type }],
        },
        null,
        null
      ],
      [
        null,
        {
          items: [
            {
              color: '#5187E8',
              openings: [
                {
                  color: 'red',
                  direction: 1,
                  beam: true,
                  on: true
                }
              ],
              type: Terminus.Type
            }
          ],
          modifiers: [
            { type: Lock.Type },
            { type: Rotate.Type },
            { type: Toggle.Type }
          ],
        },
        null,
        null
      ]
    ]
  },
  title: 'On'
}
