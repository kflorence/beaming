export default {
  layout: {
    tiles: [
      [
        null,
        {
          items: [
            {
              rotation: 4,
              type: 'Reflector'
            }
          ],
          modifiers: [{ type: 'Lock' }, { clockwise: false, type: 'Rotate' }],
          type: 'Tile'
        }
      ],
      [
        {
          modifiers: [{ type: 'Immutable' }],
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
          modifiers: [{ type: 'Lock' }],
          type: 'Tile'
        }
      ],
      [
        {
          items: [
            {
              color: 'blue',
              openings: [null, { on: true, type: 'Beam' }, null, null, null, null],
              type: 'Terminus'
            }
          ],
          modifiers: [{ type: 'Immutable' }],
          type: 'Tile'
        }
      ]
    ]
  },
  solution: {
    connections: 1
  }
}
