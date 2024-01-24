import { Puzzle } from './puzzle'

const container = document.getElementById('feedback-container')
const help = document.getElementById('help')

document.getElementById('feedback').addEventListener('click', () => {
  help.setAttribute('open', 'true')
  container.scrollIntoView(true)
})

const doorbellOptions = window.doorbellOptions
document.addEventListener(Puzzle.Events.Updated, (event) => {
  doorbellOptions.properties.puzzleId = event.detail.state.getId()
})
