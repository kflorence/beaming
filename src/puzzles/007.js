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
          modifiers: [],
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
          modifiers: [],
          type: 'Tile'
        },
        {
          items: [
            {
              color: 'red',
              openings: [null, null, null, { type: 'Beam' }, { on: true, type: 'Beam' }, null],
              type: 'Terminus'
            }
          ],
          modifiers: [],
          type: 'Tile'
        }
      ],
      [
        {
          // items: [
          //   { type: 'Reflector' }
          // ],
          // modifiers: [
          //   { type: 'Rotate' },
          //   { type: 'Swap' }
          // ],
          type: 'Tile'
        },
        {
          // items: [
          //   { type: 'Reflector' }
          // ],
          // modifiers: [
          //   { type: 'Rotate' },
          //   { type: 'Swap' }
          // ],
          type: 'Tile'
        },
        {
          items: [
            { type: 'Reflector' }
          ],
          modifiers: [
            { type: 'Move' },
            { type: 'Rotate' },
            { type: 'Swap' }
          ],
          type: 'Tile'
        },
        {
          items: [
            { type: 'Reflector' }
          ],
          modifiers: [
            { type: 'Move' },
            { type: 'Rotate' },
            { type: 'Swap' }
          ],
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
          modifiers: [],
          type: 'Tile'
        },
        {
          items: [
            {
              color: 'red',
              openings: [null, { type: 'Beam' }, { on: true, type: 'Beam' }, null, null, null],
              type: 'Terminus'
            }
          ],
          modifiers: [],
          type: 'Tile'
        },
        {
          type: 'Tile'
        },
        {
          items: [
            {
              color: 'red',
              openings: [{ on: true, type: 'Beam' }, null, null, null, null, { type: 'Beam' }],
              type: 'Terminus'
            }
          ],
          modifiers: [],
          type: 'Tile'
        }
      ]
    ]
  },
  solution: [
    { amount: 0, type: 'Connections' }
  ]
}
