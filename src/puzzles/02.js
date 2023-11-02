export default {
  connectionsRequired: 1,
  title: 'Rotate',
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
              type: 'Terminus'
            }
          ],
          modifiers: [{ type: 'Immutable' }]
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
              openings: [null, null, null, null, { on: true }, null],
              type: 'Terminus'
            }
          ],
          modifiers: [
            { type: 'Lock' },
            { type: 'Rotate' }
          ]
        },
        null,
        null
      ]
    ]
  }
}
