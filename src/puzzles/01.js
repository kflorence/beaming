export default {
  connectionsRequired: 1,
  title: 'Connect the dots',
  layout: {
    tiles: [
      [
        null,
        null,
        {
          items: [
            {
              color: 'red',
              openings: [null, null, null, null, { on: true }, null],
              type: 'Terminus'
            }
          ],
          modifiers: [{ type: 'Toggle', on: true }]
        },
        null
      ],
      [
        null,
        {
          modifiers: [{ type: 'Immutable' }]
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
              openings: [null, { on: true }, null, null, null, null],
              type: 'Terminus'
            }
          ],
          modifiers: [
            { type: 'Lock' },
            { type: 'Toggle', on: true }
          ]
        },
        null,
        null
      ]
    ]
  }
}
