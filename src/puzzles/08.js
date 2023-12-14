export default {
  connectionsRequired: 1,
  title: 'Portals II',
  layout: [
    [
      null,
      {
        items: [
          {
            direction: 0,
            type: 'Portal'
          }
        ],
        modifiers: [{ type: 'Immutable' }],
        type: 'Tile'
      },
      {
        items: [
          {
            direction: 0,
            type: 'Portal'
          }
        ],
        modifiers: [{ type: 'Immutable' }],
        type: 'Tile'
      },
      {
        items: [
          {
            openings: [null, null, null, { color: ['red', 'blue'], type: 'Beam' }, null, null],
            type: 'Terminus'
          }
        ],
        modifiers: [{ type: 'Rotate' }],
        type: 'Tile'
      },
      {
        items: [
          {
            openings: [null, null, null, null, { color: 'green', type: 'Beam' }, null],
            type: 'Terminus'
          }
        ],
        modifiers: [{ type: 'Lock' }, { type: 'Toggle' }],
        type: 'Tile'
      }
    ],
    [
      null,
      {
        items: [
          {
            openings: [{ color: 'red', type: 'Beam' }, null, null, null, null, null],
            type: 'Terminus'
          }
        ],
        modifiers: [{ type: 'Lock' }, { type: 'Rotate' }, { type: 'Toggle' }],
        type: 'Tile'
      },
      {
        items: [
          {
            openings: [{ color: 'blue', type: 'Beam' }, null, null, null, null, null],
            type: 'Terminus'
          }
        ],
        modifiers: [{ type: 'Lock' }, { type: 'Toggle' }],
        type: 'Tile'
      },
      {
        items: [
          {
            direction: 3,
            type: 'Portal'
          }
        ],
        modifiers: [{ type: 'Immutable' }],
        type: 'Tile'
      },
      null
    ]
  ]
}
