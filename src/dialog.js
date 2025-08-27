document.querySelectorAll('[data-dialog]').forEach((element) => {
  const id = element.dataset.dialog
  const dialog = document.getElementById(id)
  if (!dialog) {
    console.warn(`No matching dialog found for ID: ${id}`)
    return
  }

  element.addEventListener('click', () => {
    if (!dialog.open) {
      dialog.showModal()
      dialog.dispatchEvent(new CustomEvent('open'))
    }
  })
})
