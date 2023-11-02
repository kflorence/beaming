export default {
  connectionsRequired: 1,
  title: 'Move',
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
          items: [
            {
              openings: [0, 2, 3, 4, 5],
              type: 'Wall'
            }
          ],
          modifiers: [
            { type: 'Lock' },
            { type: 'Move' }
          ]
        },
        { modifiers: [{ type: 'Lock' }] },
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
            { type: 'Immutable' }
          ]
        },
        null,
        null
      ]
    ]
  }
}
