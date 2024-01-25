const container = document.getElementById('feedback-container')
const dialog = document.getElementById('dialog')
const help = document.getElementById('help')

document.getElementById('info').addEventListener('click', () => {
  if (!dialog.open) {
    dialog.showModal()
  }
})

document.getElementById('feedback').addEventListener('click', () => {
  help.setAttribute('open', 'true')
  container.scrollIntoView(true)
})
