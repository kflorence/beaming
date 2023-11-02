export default {
  connectionsRequired: 1,
  title: 'Filter',
  layout: {
    tiles: [
      [
        null,
        null,
        {
          items: [
            {
              openings: [null, null, null, null, { color: ['blue', 'red'] }, null],
              type: 'Terminus'
            }
          ],
          modifiers: [{ type: 'Immutable' }]
        },
        null
      ],
      [
        null,
        {},
        {},
        null
      ],
      [
        null,
        {
          items: [
            {
              direction: 5,
              type: 'Reflector'
            }
          ],
          modifiers: [{ type: 'Lock' }]
        },
        {
          items: [
            {
              color: 'red',
              type: 'Filter'
            }
          ],
          modifiers: [{ type: 'Immutable' }]
        },
        {
          items: [
            {
              color: 'blue',
              openings: [{ on: true }, null, null, null, null, null],
              type: 'Terminus'
            }
          ],
          modifiers: [{ type: 'Lock' }, { clockwise: false, type: 'Rotate' }]
        }
      ]
    ]
  }
}
