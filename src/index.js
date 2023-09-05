import paper from 'paper';
import { Puzzle } from './components/puzzle';

const puzzles = {
  "01": {
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
          color: "blue",
          offsetCoordinates: [0, 2],
          openings: [2]
        },
        {
          color: "blue",
          offsetCoordinates: [2, 1],
          openings: [5]
        }
      ]
    }
  },
  "02": {
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
          color: "blue",
          offsetCoordinates: [0, 2],
          openings: [1, 2]
        },
        {
          color: "blue",
          offsetCoordinates: [4, 2],
          openings: [4, 5]
        }
      ]
    }
  }
};

const canvas = document.getElementById("puzzle");
const error = document.getElementById("error");
//const restart = document.getElementById("restart");

const puzzleSelector = document.getElementById("puzzle-selector");
for (const id of Object.keys(puzzles)) {
  let option = document.createElement("option");
  option.value = id;
  option.innerText = id;
  puzzleSelector.appendChild(option);
}

puzzleSelector.addEventListener("change", (event) => {
  selectPuzzle(event.target.value);
});

let puzzle;
function selectPuzzle(id) {
  const configuration = puzzles[id];

  if (puzzle) {
    paper.project.clear();
  }

  if (configuration) {
    puzzleSelector.value = id;
    canvas.style.display = "block";
    error.style.display = "none";
    puzzle = new Puzzle(configuration);
  }

  else {
    canvas.style.display = "none";
    error.textContent = "Invalid puzzle ID."
    error.style.display = "flex";
  }
}

paper.setup(canvas);

const params = new URLSearchParams(window.location.search);
selectPuzzle(params.get("id") || "01");
