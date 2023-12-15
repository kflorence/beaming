export default {
  layout: [
    [
      null,
      null,
      {
        items: [
          {
            openings: [null, null, null, { color: 'red', type: 'Beam' }, { color: 'blue', type: 'Beam' }, null],
            type: 'Terminus'
          }
        ],
        modifiers: [{ type: 'Immutable' }],
        type: 'Tile'
      },
      null
    ],
    [
      null,
      {
        modifiers: [{ type: 'Immutable' }],
        type: 'Tile'
      },
      {
        modifiers: [{ type: 'Immutable' }],
        type: 'Tile'
      },
      null
    ],
    [
      null,
      {
        items: [
          {
            color: 'blue',
            openings: [null, { type: 'Beam' }, null, null, null, null],
            type: 'Terminus'
          }
        ],
        modifiers: [{ type: 'Lock' }, { type: 'Toggle' }],
        type: 'Tile'
      },
      null,
      {
        items: [
          {
            color: 'red',
            openings: [{ type: 'Beam' }, null, null, null, null, null],
            type: 'Terminus'
          }
        ],
        modifiers: [{ type: 'Lock' }, { type: 'Toggle' }],
        type: 'Tile'
      }
    ]
  ],
  solution: {
    connections: 1
  }
}
