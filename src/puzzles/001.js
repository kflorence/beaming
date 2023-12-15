export default {
  layout: [
    [
      null,
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
      },
      null
    ],
    [
      null,
      {
        modifiers: [{ type: 'Immutable' }],
        type: 'Tile'
      },
      null,
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
        modifiers: [
          { type: 'Lock' },
          { type: 'Toggle' }
        ],
        type: 'Tile'
      },
      null,
      null
    ]
  ],
  solution: {
    connections: 1
  }
}
