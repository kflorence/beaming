export default {
  connectionsRequired: 1,
  title: 'Portals II',
  layout: {
    tiles: [
      [
        null,
        {
          items: [
            {
              direction: 0,
              type: 'Portal'
            }
          ],
          modifiers: [{ type: 'Immutable' }]
        },
        {
          items: [
            {
              direction: 0,
              type: 'Portal'
            }
          ],
          modifiers: [{ type: 'Immutable' }]
        },
        {
          items: [
            {
              openings: [null, null, null, { color: ['red', 'blue'] }, null, null],
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
          items: [
            {
              openings: [{ color: 'red' }, null, null, null, null, null],
              type: 'Terminus'
            }
          ],
          modifiers: [{ type: 'Lock' }, { type: 'Rotate' }, { type: 'Toggle' }]
        },
        {
          items: [
            {
              openings: [{ color: 'blue' }, null, null, null, null, null],
              type: 'Terminus'
            }
          ],
          modifiers: [{ type: 'Lock' }, { type: 'Toggle' }]
        },
        {
          items: [
            {
              direction: 3,
              type: 'Portal'
            }
          ],
          modifiers: [{ type: 'Immutable' }]
        },
        null
      ]
    ]
  }
}
