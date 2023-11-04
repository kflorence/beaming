export default {
  connectionsRequired: 1,
  title: 'Move',
  layout: {
    tiles: [
      [
        null,
        null,
        { modifiers: [{ type: 'Lock' }] },
        null
      ],
      [
        null,
        {
          items: [
            {
              color: 'blue',
              openings: [null, {}, null, null, null, null],
              type: 'Terminus'
            }
          ],
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
            { type: 'Move' }
          ]
        },
        null,
        null
      ]
    ]
  }
}
