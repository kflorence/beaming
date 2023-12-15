export default {
  layout: [
    [
      null,
      {
        items: [
          {
            color: 'blue',
            openings: [null, null, null, { type: 'Beam' }, null, null],
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
            direction: 0,
            type: 'Portal'
          }
        ],
        modifiers: [{ type: 'Lock' }],
        type: 'Tile'
      },
      null
    ],
    [
      null,
      {
        items: [
          {
            direction: 3,
            type: 'Portal'
          }
        ],
        modifiers: [{ type: 'Lock' }],
        type: 'Tile'
      },
      null,
      {
        items: [
          {
            color: 'blue',
            openings: [{ type: 'Beam' }, null, null, null, null, null],
            type: 'Terminus'
          }
        ],
        modifiers: [{ type: 'Lock' }, { type: 'Toggle' }],
        type: 'Tile'
      },
      null
    ]
  ],
  solution: {
    connections: 1
  }
}
