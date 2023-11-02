export default {
  connectionsRequired: 1,
  title: 'Reflect',
  layout: {
    tiles: [
      [
        null,
        null,
        {
          items: [
            {
              direction: 4,
              type: 'Reflector'
            }
          ],
          modifiers: [{ type: 'Lock' }, { type: 'Rotate' }]
        },
        null
      ],
      [
        null,
        {
          modifiers: [{ type: 'Immutable' }]
        },
        {
          items: [
            {
              color: 'blue',
              openings: [{}, null, null, null, null, null],
              type: 'Terminus'
            }
          ],
          modifiers: [{ type: 'Lock' }]
        },
        null
      ],
      [
        null,
        {
          items: [
            {
              color: 'blue',
              openings: [null, { on: true }, null, null, null, null],
              type: 'Terminus'
            }
          ],
          modifiers: [{ type: 'Immutable' }]
        },
        null,
        null
      ]
    ]
  }
}
