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

export function confirm (text, callback) {
  const template = document.getElementById('dialog-confirm')
  const fragment = document.importNode(template.content, true)
  const dialog = fragment.children[0]

  function teardown () {
    dialog.close()
    dialog.remove()
  }

  dialog.querySelector('main').textContent = text
  dialog.querySelector('.accept').addEventListener('click', (event) => {
    event.currentTarget.disabled = true
    callback()
    teardown()
  })
  dialog.querySelector('.cancel').addEventListener('click', teardown)

  document.body.appendChild(fragment)
  dialog.showModal()
}
