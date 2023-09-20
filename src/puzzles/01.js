import { Toggleable } from '../components/modifiers/toggleable'
import { Terminus } from '../components/items/terminus'
import { Locked } from '../components/modifiers/locked'

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
              modifiers: [{ type: Locked.Type }],
              openings: [{ direction: 4 }],
              type: Terminus.Type
            }
          ]
        },
        null
      ],
      [
        null,
        {},
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
                { type: Locked.Type },
                { selected: true, type: Toggleable.Type }
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
  }
}
