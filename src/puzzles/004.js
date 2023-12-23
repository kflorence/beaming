export default {
  layout: {
    tiles: [
      [
        {
          type: 'Tile'
        },
        {
          items: [
            {
              color: 'blue',
              openings: [null, null, null, null, null, { on: true, type: 'Beam' }],
              type: 'Terminus'
            }
          ],
          modifiers: [
            { type: 'Lock' },
            { type: 'Move' },
            { clockwise: false, type: 'Rotate' }
          ],
          type: 'Tile'
        }
      ],
      [
        {
          items: [
            {
              color: 'blue',
              openings: [null, { type: 'Beam' }, null, null, null, null],
              type: 'Terminus'
            }
          ],
          modifiers: [
            { type: 'Lock' }
          ],
          type: 'Tile'
        },
        {
          type: 'Tile'
        },
        {
          items: [
            {
              color: 'red',
              openings: [null, null, null, null, { type: 'Beam' }, null],
              type: 'Terminus'
            }
          ],
          modifiers: [
            { type: 'Lock' }
          ],
          type: 'Tile'
        }
      ],
      [
        {
          items: [
            {
              color: 'red',
              openings: [null, null, { on: true, type: 'Beam' }, null, null, null],
              type: 'Terminus'
            }
          ],
          modifiers: [
            { type: 'Lock' },
            { type: 'Move' }
          ],
          type: 'Tile'
        },
        { type: 'Tile' }
      ]
    ],
    type: 'even-r'
  },
  solution: [
    { amount: 2, type: 'Connections' }
  ]
}
