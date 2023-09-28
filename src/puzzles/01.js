import { Toggle } from '../components/modifiers/toggle'
import { Terminus } from '../components/items/terminus'
import { Lock } from '../components/modifiers/lock'
import { Rotate } from '../components/modifiers/rotate'
import { Immutable } from '../components/modifiers/immutable'

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
              openings: [null, null, null, null, {}, null],
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
          modifiers: [{ type: Immutable.Type }]
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
              openings: [null, {}, null, null, null, null],
              type: Terminus.Type
            }
          ],
          modifiers: [
            { type: Lock.Type },
            { type: Rotate.Type },
            { type: Toggle.Type }
          ]
        },
        null,
        null
      ]
    ]
  },
  title: 'On'
}
