export default {
  layout: {
    tiles: [
      [
        null,
        {
          items: [
            {
              openings: [null, null, null, null, { color: ['blue', 'red'], type: 'Beam' }, null],
              type: 'Terminus'
            }
          ],
          modifiers: [{ type: 'Immutable' }],
          type: 'Tile'
        },
        null
      ],
      [
        {
          type: 'Tile'
        },
        {
          type: 'Tile'
        }
      ],
      [
        {
          items: [
            {
              rotation: 5,
              type: 'Reflector'
            }
          ],
          modifiers: [{ type: 'Immutable' }],
          type: 'Tile'
        },
        {
          items: [
            {
              color: 'red',
              type: 'Filter'
            }
          ],
          modifiers: [{ type: 'Immutable' }],
          type: 'Tile'
        },
        {
          items: [
            {
              color: 'blue',
              openings: [{ on: true, type: 'Beam' }, null, null, null, null, null],
              type: 'Terminus'
            }
          ],
          modifiers: [{ type: 'Lock' }, { clockwise: false, type: 'Rotate' }],
          type: 'Tile'
        }
      ]
    ]
  },
  solution: {
    connections: 1
  }
}
