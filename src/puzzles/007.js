export default {
  layout: {
    tiles: [
      [
        {
          items: [
            {
              color: 'blue',
              openings: [null, null, { type: 'Beam' }, { on: true, type: 'Beam' }, null, null],
              type: 'Terminus'
            }
          ],
          modifiers: [
            { type: 'Immutable' }
          ],
          type: 'Tile'
        },
        {
          type: 'Tile'
        },
        {
          items: [
            {
              color: 'blue',
              openings: [null, null, null, null, { type: 'Beam' }, { on: true, type: 'Beam' }],
              type: 'Terminus'
            }
          ],
          modifiers: [
            { type: 'Immutable' }
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
          modifiers: [
            { type: 'Immutable' }
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
              openings: [null, null, null, null, { on: true, type: 'Beam' }, { type: 'Beam' }],
              type: 'Terminus'
            }
          ],
          modifiers: [
            { type: 'Immutable' }
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
          items: [
            { rotation: 3, type: 'Reflector' }
          ],
          modifiers: [
            { type: 'Lock' },
            { type: 'Rotate' }
          ],
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
              openings: [{ type: 'Beam' }, { on: true, type: 'Beam' }, null, null, null, null],
              type: 'Terminus'
            }
          ],
          modifiers: [
            { type: 'Immutable' }
          ],
          type: 'Tile'
        },
        {
          items: [
            { rotation: 3, type: 'Reflector' }
          ],
          modifiers: [
            { type: 'Move' }
          ],
          type: 'Tile'
        },
        {
          items: [
            { rotation: 3, type: 'Reflector' }
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
          modifiers: [
            { type: 'Immutable' }
          ],
          type: 'Tile'
        }
      ]
    ]
  },
  solution: [
    { amount: 0, type: 'Connections' },
    { amount: 6, type: 'Moves' }
  ],
  version: 1
}
