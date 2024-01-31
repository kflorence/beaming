export default {
  layout: {
    tiles: [
      [
        null,
        {
          items: [
            {
              type: 'Reflector'
            }
          ],
          modifiers: [
            { type: 'Move' },
            { type: 'Rotate' }
          ],
          type: 'Tile'
        },
        {
          type: 'Tile'
        },
        {
          items: [
            {
              direction: 5,
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
          items: [
            {
              direction: 5,
              type: 'Portal'
            }
          ],
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
          items: [
            {
              direction: 5,
              type: 'Portal'
            }
          ],
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
              direction: 5,
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
              type: 'Reflector'
            }
          ],
          modifiers: [
            { type: 'Move' },
            { type: 'Rotate' }
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
