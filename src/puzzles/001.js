export default {
  layout: {
    tiles: [
      [
        {
          items: [
            {
              color: 'blue',
              openings: [null, null, null, { on: true, type: 'Beam' }, null, null],
              type: 'Terminus'
            }
          ],
          modifiers: [
            { type: 'Lock' }
          ],
          type: 'Tile'
        },
        { type: 'Tile' }
      ],
      [
        { type: 'Tile' },
        { type: 'Tile' },
        { type: 'Tile' }
      ],
      [
        {
          items: [
            {
              color: 'red',
              openings: [null, { on: true, type: 'Beam' }, null, null, null, null],
              type: 'Terminus'
            }
          ],
          modifiers: [
            { type: 'Lock' },
            { type: 'Toggle' }
          ],
          type: 'Tile'
        },
        {
          items: [
            {
              color: 'blue',
              openings: [{ type: 'Beam' }, null, null, null, null, null],
              type: 'Terminus'
            }
          ],
          modifiers: [
            { type: 'Lock' }
          ],
          type: 'Tile'
        }
      ]
    ],
    type: 'even-r'
  },
  solution: [
    { amount: 1, type: 'Connections' }
  ]
}
