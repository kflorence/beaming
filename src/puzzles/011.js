export default {
  layout: {
    tiles: [
      [
        {
          items: [
            {
              direction: 5,
              type: 'Portal'
            }
          ],
          modifiers: [
            { type: 'Lock' }
          ],
          type: 'Tile'
        },
        {
          items: [
            {
              direction: 5,
              type: 'Portal'
            }
          ],
          modifiers: [
            { type: 'Lock' }
          ],
          type: 'Tile'
        }
      ],
      [
        {
          items: [
            {
              openings: [
                null,
                null,
                { color: 'blue', on: true, type: 'Beam' },
                null,
                null,
                null
              ],
              type: 'Terminus'
            }
          ],
          modifiers: [
            { type: 'Immutable' }
          ],
          type: 'Tile'
        },
        {
          items: [
            {
              direction: 2,
              type: 'Portal'
            }
          ],
          modifiers: [
            { type: 'Lock' }
          ],
          type: 'Tile'
        },
        {
          items: [
            {
              openings: [
                null,
                null,
                null,
                null,
                null,
                { color: 'blue', type: 'Beam' }
              ],
              type: 'Terminus'
            }
          ],
          modifiers: [
            { type: 'Immutable' }
          ],
          type: 'Tile'
        }
      ],
      [
        {
          items: [
            {
              direction: 5,
              type: 'Portal'
            }
          ],
          modifiers: [
            { type: 'Rotate' }
          ],
          type: 'Tile'
        },
        {
          items: [
            {
              direction: 5,
              type: 'Portal'
            }
          ],
          modifiers: [
            { type: 'Lock' }
          ],
          type: 'Tile'
        }
      ]
    ],
    type: 'even-r'
  },
  solution: [
    { amount: 1, type: 'Connections' }
  ]
}
