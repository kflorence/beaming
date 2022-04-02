import paper from 'paper';
import { Puzzle } from './components/puzzle';

paper.setup(document.getElementById("canvas"));

// TODO add support for reflective segments in tiles
export const puzzle = new Puzzle({
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
        direction: 6,
        offsetCoordinates: [2, 1]
      },
      {
        direction: 0,
        offsetCoordinates: [2, 3]
      }
    ],
    terminuses: [
      {
        color: "blue",
        offsetCoordinates: [0, 2],
        openings: [1, 2]
      },
      {
        activated: true,
        color: "blue",
        offsetCoordinates: [4, 2],
        openings: [4, 5]
      }
    ]
  }
});
