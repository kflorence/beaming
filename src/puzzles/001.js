export default {
  layout: {
    tiles: [
      [
        null,
        {
          items: [
            {
              color: 'blue',
              openings: [null, null, null, null, { type: 'Beam' }, null],
              type: 'Terminus'
            }
          ],
          modifiers: [{ type: 'Immutable' }],
          type: 'Tile'
        }
      ],
      [
        {
          modifiers: [{ type: 'Immutable' }],
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
            { type: 'Lock' },
            { type: 'Toggle' }
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
