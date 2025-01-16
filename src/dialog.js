document.querySelectorAll('.dialog').forEach((element) => {
  const dialog = document.getElementById(`dialog-${element.id}`)
  element.addEventListener('click', () => {
    if (!dialog.open) {
      dialog.showModal()
    }
  })
})
