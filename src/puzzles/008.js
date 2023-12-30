export default {
  layout: {
    tiles: [
      [
        {
          items: [
            {
              color: 'blue',
              openings: [null, null, null, { type: 'Beam' }, null, null],
              type: 'Terminus'
            }
          ],
          modifiers: [
            { type: 'Lock' },
            { type: 'Swap' }
          ],
          type: 'Tile'
        },
        {
          modifiers: [
            { type: 'Lock' },
            { type: 'Rotate' }
          ],
          type: 'Tile'
        },
        {
          modifiers: [
            { type: 'Lock' },
            { type: 'Toggle' }
          ],
          type: 'Tile'
        },
        {
          items: [
            {
              color: ['red', 'blue'],
              openings: [null, null, null, null, { type: 'Beam' }, null],
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
            { type: 'Reflector' }
          ],
          modifiers: [
            { type: 'Lock' },
            { type: 'Move' }
          ],
          type: 'Tile'
        },
        {
          items: [
            {
              color: 'blue',
              type: 'Filter'
            }
          ],
          modifiers: [
            { type: 'Lock' },
            { type: 'Move' }
          ],
          type: 'Tile'
        },
        {
          items: [
            {
              color: 'red',
              type: 'Filter'
            }
          ],
          modifiers: [
            { type: 'Lock' },
            { type: 'Move' }
          ],
          type: 'Tile'
        },
        {
          items: [
            { type: 'Reflector' }
          ],
          modifiers: [
            { type: 'Lock' },
            { type: 'Move' }
          ],
          type: 'Tile'
        }
      ],
      [
        null,
        {
          items: [
            {
              color: ['red', 'blue'],
              openings: [null, { type: 'Beam' }, null, null, null, null],
              type: 'Terminus'
            }
          ],
          modifiers: [
            { type: 'Immutable' }
          ],
          type: 'Tile'
        },
        {
          modifiers: [
            { type: 'Lock' },
            { type: 'Toggle' }
          ],
          type: 'Tile'
        },
        {
          modifiers: [
            { type: 'Lock' },
            { type: 'Rotate' }
          ],
          type: 'Tile'
        },
        {
          items: [
            {
              color: 'red',
              openings: [{ type: 'Beam' }, null, null, null, null, null],
              type: 'Terminus'
            }
          ],
          modifiers: [
            { type: 'Lock' },
            { type: 'Swap' }
          ],
          type: 'Tile'
        }
      ]
    ]
  },
  solution: [
    { amount: 2, type: 'Connections' }
  ]
}
