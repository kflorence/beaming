import paper from 'paper'
import { Puzzle } from './components/puzzle'
import puzzles from './puzzles'

document.body.addEventListener('contextmenu', (event) => {
  event.preventDefault()
  return false
})

const canvas = document.getElementById('puzzle')
const error = document.getElementById('error')
// const restart = document.getElementById("restart");

const puzzleSelector = document.getElementById('puzzle-selector')
for (const id of Object.keys(puzzles)) {
  const option = document.createElement('option')
  option.value = id
  option.innerText = id
  puzzleSelector.appendChild(option)
}

puzzleSelector.addEventListener('change', (event) => {
  selectPuzzle(event.target.value)
})

let puzzle
function selectPuzzle (id) {
  const configuration = puzzles[id]

  if (puzzle) {
    paper.project.clear()
  }

  if (configuration) {
    puzzleSelector.value = id
    canvas.style.display = 'block'
    error.style.display = 'none'
    puzzle = new Puzzle(configuration)
  } else {
    canvas.style.display = 'none'
    error.textContent = 'Invalid puzzle ID.'
    error.style.display = 'flex'
  }
}

paper.setup(canvas)

const params = new URLSearchParams(window.location.search)
selectPuzzle(params.get('id') || '01')
