export default {
  layout: {
    tiles: [
      [
        null,
        {
          items: [
            {
              direction: 3,
              type: 'Portal'
            }
          ],
          type: 'Tile'
        },
        {
          type: 'Tile'
        },
        {
          items: [
            {
              direction: 4,
              type: 'Portal'
            }
          ],
          type: 'Tile'
        }
      ],
      [
        {
          type: 'Tile'
        },
        { type: 'Tile' },
        {
          type: 'Tile'
        },
        {
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
                { color: 'blue', type: 'Beam' },
                null,
                null,
                null
              ],
              type: 'Terminus'
            }
          ],
          modifiers: [
            { type: 'Rotate' },
            { type: 'Toggle' }
          ],
          type: 'Tile'
        },
        { type: 'Tile' },
        {
          items: [
            {
              type: 'Portal'
            }
          ],
          type: 'Tile'
        },
        { type: 'Tile' },
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
            { type: 'Rotate' },
            { type: 'Toggle' }
          ],
          type: 'Tile'
        }
      ],
      [
        {
          type: 'Tile'
        },
        {
          type: 'Tile'
        },
        { type: 'Tile' },
        {
          type: 'Tile'
        }
      ],
      [
        null,
        {
          items: [
            {
              direction: 2,
              type: 'Portal'
            }
          ],
          type: 'Tile'
        },
        {
          type: 'Tile'
        },
        {
          items: [
            {
              direction: 0,
              type: 'Portal'
            }
          ],
          type: 'Tile'
        }
      ]
    ]
  },
  solution: [
    { amount: 1, type: 'Connections' }
  ]
}
