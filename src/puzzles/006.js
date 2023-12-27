export default {
  layout: {
    tiles: [
      [
        {
          items: [
            {
              rotation: 2,
              type: 'Reflector'
            }
          ],
          modifiers: [
            { type: 'Lock' },
            { type: 'Swap' }
          ],
          type: 'Tile'
        },
        {
          items: [
            {
              type: 'Reflector'
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
                null,
                { color: 'red', type: 'Beam' },
                null,
                { color: 'blue', on: true, type: 'Beam' }
              ],
              type: 'Terminus'
            }
          ],
          modifiers: [
            { type: 'Lock' }
          ],
          type: 'Tile'
        },
        {
          type: 'Tile'
        },
        {
          items: [
            {
              openings: [
                { color: 'blue', type: 'Beam' },
                null,
                { color: 'red', on: true, type: 'Beam' },
                null,
                null,
                null
              ],
              type: 'Terminus'
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
              type: 'Reflector'
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
              rotation: 2,
              type: 'Reflector'
            }
          ],
          modifiers: [
            { type: 'Lock' },
            { type: 'Swap' }
          ],
          type: 'Tile'
        }
      ]
    ],
    type: 'even-r'
  },
  solution: [
    { amount: 2, type: 'Connections' }
  ]
}
