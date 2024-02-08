export default {
  layout: {
    tiles: [
      [
        {
          items: [
            {
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
              direction: 0,
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
      ]
    ],
    type: 'even-r'
  },
  solution: [
    { amount: 1, type: 'Connections' }
  ],
  version: 1
}
