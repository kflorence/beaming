export default {
  layout: {
    tiles: [
      [
        {
          items: [
            {
              color: 'blue',
              openings: [null, null, { type: 'Beam' }, null, { type: 'Beam' }, null],
              type: 'Terminus'
            }
          ],
          modifiers: [{ type: 'Lock' }, { type: 'Toggle' }],
          type: 'Tile'
        },
        {
          items: [
            {
              color: 'blue',
              openings: [null, null, null, { type: 'Beam' }, null, { type: 'Beam' }],
              type: 'Terminus'
            }
          ],
          modifiers: [{ type: 'Lock' }, { type: 'Toggle' }],
          type: 'Tile'
        }
      ],
      [
        {
          items: [
            {
              color: 'blue',
              openings: [null, { type: 'Beam' }, null, { type: 'Beam' }, null, null],
              type: 'Terminus'
            }
          ],
          modifiers: [
            { type: 'Lock' },
            { type: 'Toggle' }
          ],
          type: 'Tile'
        },
        { type: 'Tile' },
        {
          items: [
            {
              color: 'blue',
              openings: [{ type: 'Beam' }, null, null, null, { type: 'Beam' }, null],
              type: 'Terminus'
            }
          ],
          modifiers: [
            { type: 'Lock' },
            { type: 'Toggle' }
          ],
          type: 'Tile'
        }
      ],
      [
        {
          items: [
            {
              color: 'blue',
              openings: [{ type: 'Beam' }, null, { type: 'Beam' }, null, null, null],
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
              openings: [null, { type: 'Beam' }, null, null, null, { type: 'Beam' }],
              type: 'Terminus'
            }
          ],
          modifiers: [
            { type: 'Lock' },
            { type: 'Toggle' }
          ],
          type: 'Tile'
        }
      ]
    ],
    type: 'even-r'
  },
  solution: {
    connections: 6,
    moves: 3 // TODO implement
  }
}
