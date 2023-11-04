export default {
  connectionsRequired: 1,
  title: 'Portal',
  layout: {
    tiles: [
      [
        null,
        {
          items: [
            {
              color: 'blue',
              openings: [null, null, null, {}, null, null],
              type: 'Terminus'
            }
          ],
          modifiers: [{ type: 'Lock' }, { type: 'Toggle' }]
        },
        null,
        {
          items: [
            {
              direction: 0,
              type: 'Portal'
            }
          ],
          modifiers: [{ type: 'Lock' }]
        },
        null
      ],
      [
        null,
        {
          items: [
            {
              direction: 0,
              type: 'Portal'
            }
          ],
          modifiers: [{ type: 'Lock' }]
        },
        null,
        {
          items: [
            {
              color: 'blue',
              openings: [{}, null, null, null, null, null],
              type: 'Terminus'
            }
          ],
          modifiers: [{ type: 'Lock' }, { type: 'Toggle' }]
        },
        null
      ]
    ]
  }
}
