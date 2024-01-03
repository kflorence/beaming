export default {
  layout: {
    tiles: [
      [
        {
          items: [
            {
              color: 'blue',
              openings: [null, null, { on: true, type: 'Beam' }, { type: 'Beam' }, null, null],
              type: 'Terminus'
            }
          ],
          type: 'Tile'
        },
        {
          type: 'Tile'
        },
        {
          type: 'Tile'
        },
        {
          items: [
            {
              color: 'blue',
              openings: [null, null, null, null, { on: true, type: 'Beam' }, { type: 'Beam' }],
              type: 'Terminus'
            }
          ],
          type: 'Tile'
        },
        {
          items: [
            { rotation: 3, type: 'Reflector' }
          ],
          modifiers: [
            { type: 'Lock' },
            { type: 'Move' },
            { type: 'Rotate' }
          ],
          type: 'Tile'
        },
        {
          items: [
            {
              color: 'red',
              openings: [null, null, { on: true, type: 'Beam' }, { type: 'Beam' }, null, null],
              type: 'Terminus'
            }
          ],
          type: 'Tile'
        },
        {
          type: 'Tile'
        },
        {
          type: 'Tile'
        },
        {
          items: [
            {
              color: 'red',
              openings: [null, null, null, null, { on: true, type: 'Beam' }, { type: 'Beam' }],
              type: 'Terminus'
            }
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
        {
          type: 'Tile'
        },
        {
          type: 'Tile'
        },
        {
          type: 'Tile'
        },
        {
          type: 'Tile'
        },
        {
          type: 'Tile'
        },
        {
          type: 'Tile'
        }
      ],
      [
        null,
        {
          type: 'Tile'
        },
        {
          type: 'Tile'
        },
        {
          type: 'Tile'
        },
        {
          type: 'Tile'
        },
        {
          type: 'Tile'
        },
        {
          type: 'Tile'
        },
        {
          type: 'Tile'
        }
      ],
      [
        null,
        {
          items: [
            {
              color: 'blue',
              openings: [{ on: true, type: 'Beam' }, { type: 'Beam' }, null, null, null, null],
              type: 'Terminus'
            }
          ],
          type: 'Tile'
        },
        {
          items: [
            { rotation: 3, type: 'Reflector' }
          ],
          modifiers: [
            { type: 'Lock' },
            { type: 'Move' }
          ],
          type: 'Tile'
        },
        {
          type: 'Tile'
        },
        {
          type: 'Tile'
        },
        {
          items: [
            { rotation: 3, type: 'Reflector' }
          ],
          modifiers: [
            { type: 'Lock' },
            { type: 'Move' }
          ],
          type: 'Tile'
        },
        {
          items: [
            {
              color: 'red',
              openings: [{ on: true, type: 'Beam' }, { type: 'Beam' }, null, null, null, null],
              type: 'Terminus'
            }
          ],
          type: 'Tile'
        }
      ]
    ]
  },
  solution: [
    { amount: 0, type: 'Connections' },
    { amount: 4, type: 'Moves' }
  ]
}
