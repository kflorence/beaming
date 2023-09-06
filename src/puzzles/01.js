export default {
  layout: {
    tiles: [
      [null, null, {}, null],
      [null, {}, null, null],
      [null, {}, null, null]
    ],
    tileSize: 100
  },
  objects: {
    termini: [
      {
        color: 'blue',
        offsetCoordinates: [0, 2],
        openings: [2]
      },
      {
        color: 'blue',
        offsetCoordinates: [2, 1],
        openings: [5]
      }
    ]
  }
}
