import { Toggle } from '../components/modifiers/toggle'
import { Terminus } from '../components/items/terminus'

// TODO: move items into individual tile configuration
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
              modifiers: [],
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
                Toggle.Type
              ],
              openings: [
                {
                  beam: { active: false },
                  direction: 1
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
