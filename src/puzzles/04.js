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
              openings: [
                null,
                null,
                null,
                { color: 'red' },
                { color: 'blue' },
                null
              ],
              type: 'Terminus'
            }
          ],
          modifiers: [{ type: 'Lock' }]
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
              type: 'Reflector'
            }
          ],
          modifiers: [{ type: 'Lock' }, { type: 'Rotate' }]
        },
        null,
        {
          items: [
            {
              direction: 3,
              type: 'Reflector'
            }
          ],
          modifiers: [{ type: 'Lock' }, { type: 'Rotate' }]
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
              openings: [
                { color: 'blue', on: true },
                { color: 'red', on: true },
                null,
                null,
                null,
                null
              ],
              type: 'Terminus'
            }
          ],
          modifiers: [{ type: 'Lock' }, { on: true, type: 'Toggle' }]
        },
        null,
        null
      ]
    ]
  },
  title: 'Test'
}
