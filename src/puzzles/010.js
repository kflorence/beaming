export default {
  layout: {
    tiles: [
      [
        {
          modifiers: [
            { type: 'Immutable' }
          ],
          type: 'Tile'
        },
        { type: 'Tile' },
        null,
        null,
        {
          type: 'Tile'
        },
        { type: 'Tile' }
      ],
      [
        {
          items: [
            {
              color: 'green',
              openings: [null, { on: true, type: 'Beam' }, null, null, null, null],
              type: 'Terminus'
            }
          ],
          modifiers: [
            { type: 'Lock' }
          ],
          type: 'Tile'
        },
        {
          items: [
            { type: 'Portal' }
          ],
          modifiers: [
            { type: 'Move' }
          ],
          type: 'Tile'
        },
        { type: 'Tile' },
        null,
        {
          items: [
            {
              color: 'green',
              openings: [null, null, null, { type: 'Beam' }, null, null],
              type: 'Terminus'
            }
          ],
          modifiers: [
            { type: 'Lock' }
          ],
          type: 'Tile'
        },
        {
          items: [
            { type: 'Portal' }
          ],
          type: 'Tile'
        },
        {
          items: [
            { type: 'Reflector' }
          ],
          modifiers: [
            { type: 'Lock' }
          ],
          type: 'Tile'
        }
      ],
      [
        {
          type: 'Tile'
        },
        {
          type: 'Tile'
        },
        null,
        null,
        { type: 'Tile' },
        { type: 'Tile' }
      ]
    ],
    type: 'even-r'
  },
  solution: [
    { amount: 1, type: 'Connections' }
  ]
}
