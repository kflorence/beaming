const dialog = document.getElementById('dialog')
document.getElementById('info').addEventListener('click', () => {
  if (!dialog.open) {
    dialog.showModal()
  }
})
