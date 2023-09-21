export default {
  connections: 2,
  layout: {
    tiles: [
      [null, null, {}, null, null],
      [null, {}, {}, null, null],
      [null, {}, null, {}, null],
      [null, {}, {}, null, null],
      [null, null, {}, null, null]
    ],
    tileSize: 100
  },
  items: [
    {
      direction: 3,
      offsetCoordinates: [2, 1],
      type: 'Reflector'
    },
    {
      direction: 3,
      offsetCoordinates: [2, 3],
      type: 'Reflector'
    },
    {
      color: 'blue',
      offsetCoordinates: [0, 2],
      openings: [1, 2],
      type: 'Terminus'
    },
    {
      color: 'red',
      offsetCoordinates: [4, 2],
      openings: [4, 5],
      type: 'Terminus'
    }
  ]
}
