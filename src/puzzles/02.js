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
  objects: {
    reflectors: [
      {
        direction: 3,
        offsetCoordinates: [2, 1]
      },
      {
        direction: 3,
        offsetCoordinates: [2, 3]
      }
    ],
    termini: [
      {
        color: 'blue',
        offsetCoordinates: [0, 2],
        openings: [1, 2]
      },
      {
        color: 'blue',
        offsetCoordinates: [4, 2],
        openings: [4, 5]
      }
    ]
  }
}
