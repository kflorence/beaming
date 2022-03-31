import paper from 'paper';
import { Puzzle } from './components/puzzle';

paper.setup(document.getElementById("canvas"));

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
        direction: 0,
        offsetCoordinates: [2, 3]
      }
    ],
    terminuses: [
      {
        activated: false,
        color: "blue",
        offsetCoordinates: [0, 2],
        openings: [1]
      },
      {
        activated: true,
        color: "blue",
        offsetCoordinates: [4, 2],
        openings: [5]
      }
    ]
  }
});
