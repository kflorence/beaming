export default {
  connectionsRequired: 1,
  title: 'Move',
  layout: [
    [
      null,
      null,
      {
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
            color: 'blue',
            openings: [null, { type: 'Beam' }, null, null, null, null],
            type: 'Terminus'
          }
        ],
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
            openings: [null, null, null, null, { on: true, type: 'Beam' }, null],
            type: 'Terminus'
          }
        ],
        modifiers: [
          { type: 'Lock' },
          { type: 'Move' }
        ],
        type: 'Tile'
      },
      null,
      null
    ]
  ]
}
