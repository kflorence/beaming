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
              openings: [null, null, null, null, { on: true, type: 'Beam' }, null],
              type: 'Terminus'
            }
          ],
          modifiers: [
            { type: 'Lock' },
            { type: 'Rotate' }
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
