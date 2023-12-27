export default {
  layout: {
    tiles: [
      [
        null,
        { type: 'Tile' },
        { type: 'Tile' },
        { type: 'Tile' }
      ],
      [
        {
          items: [
            {
              color: '#BBDBB4',
              openings: [null, null, { on: true, type: 'Beam' }, { type: 'Beam' }, null, null],
              type: 'Terminus'
            }
          ],
          modifiers: [
            { on: true, type: 'Toggle' }
          ],
          type: 'Tile'
        },
        { type: 'Tile' },
        { type: 'Tile' },
        {
          items: [
            {
              color: '#BBDBB4',
              openings: [null, null, null, null, { type: 'Beam' }, { type: 'Beam' }],
              type: 'Terminus'
            }
          ],
          modifiers: [
            { type: 'Toggle' }
          ],
          type: 'Tile'
        }
      ],
      [
        {
          items: [
            {
              color: '#D56AA0',
              openings: [null, null, { type: 'Beam'}, null, null, null],
              type: 'Terminus'
            }
          ],
          type: 'Tile'
        },
        { type: 'Tile' },
        null,
        { type: 'Tile' },
        { type: 'Tile' }
      ],
      [
        { type: 'Tile' },
        { type: 'Tile' },
        { type: 'Tile' },
        { type: 'Tile' }
      ],
      [
        null,
        { type: 'Tile' },
        {
          items: [
            {
              color: '#BBDBB4',
              openings: [{ on: true, type: 'Beam'}, { on: true, type: 'Beam'}, null, null, null, null],
              type: 'Terminus'
            }
          ],
          modifiers: [
            { type: 'Toggle' }
          ],
          type: 'Tile'
        },
        { type: 'Tile' }
      ]
    ]
  },
  solution: [
    { amount: 1, type: 'Connections' }
  ]
}
