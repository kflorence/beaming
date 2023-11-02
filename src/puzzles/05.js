export default {
  connectionsRequired: 1,
  title: 'Color',
  layout: {
    tiles: [
      [
        null,
        null,
        {
          items: [
            {
              openings: [null, null, null, { color: 'red' }, { color: 'blue' }, null],
              type: 'Terminus'
            }
          ],
          modifiers: [{ type: 'Immutable' }]
        },
        null
      ],
      [
        null,
        {
          modifiers: [{ type: 'Immutable' }]
        },
        {
          modifiers: [{ type: 'Immutable' }]
        },
        null
      ],
      [
        null,
        {
          items: [
            {
              color: 'blue',
              openings: [null, {}, null, null, null, null],
              type: 'Terminus'
            }
          ],
          modifiers: [{ type: 'Lock' }, { type: 'Toggle' }]
        },
        null,
        {
          items: [
            {
              color: 'red',
              openings: [{}, null, null, null, null, null],
              type: 'Terminus'
            }
          ],
          modifiers: [{ type: 'Lock' }, { type: 'Toggle' }]
        }
      ]
    ]
  }
}
