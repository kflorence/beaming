export default {
  connectionsRequired: 1,
  title: 'Reflect',
  layout: [
    [
      null,
      null,
      {
        items: [
          {
            direction: 4,
            type: 'Reflector'
          }
        ],
        modifiers: [{ type: 'Lock' }, { clockwise: false, type: 'Rotate' }],
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
        items: [
          {
            color: 'blue',
            openings: [{ type: 'Beam' }, null, null, null, null, null],
            type: 'Terminus'
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
            color: 'blue',
            openings: [null, { on: true, type: 'Beam' }, null, null, null, null],
            type: 'Terminus'
          }
        ],
        modifiers: [{ type: 'Immutable' }],
        type: 'Tile'
      },
      null,
      null
    ]
  ]
}
