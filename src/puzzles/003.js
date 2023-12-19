export default {
  layout: {
    tiles: [
      [
        null,
        {
          modifiers: [{ type: 'Lock' }],
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
          modifiers: [{ type: 'Immutable' }],
          type: 'Tile'
        }
      ],
      [
        {
          items: [
            {
              color: 'blue',
              openings: [null, null, null, null, { on: true, type: 'Beam' }, null],
              type: 'Terminus'
            }
          ],
          modifiers: [
            { type: 'Lock' },
            { type: 'Move' }
          ],
          type: 'Tile'
        }
      ]
    ]
  },
  solution: {
    connections: 1
  }
}
