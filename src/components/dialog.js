import { animate } from './util.js'

const title = document.getElementById('dialog-title')

document.querySelectorAll('[data-dialog]').forEach((element) => {
  const id = element.dataset.dialog
  const dialog = document.getElementById(id)
  if (!dialog) {
    console.warn(`No matching dialog found for ID: ${id}`)
    return
  }

  const close = dialog.querySelector('header button')
  close.addEventListener('click', () => {
    animate(dialog, 'slide-down-out', () => { dialog.close() })
    animate(title, 'slide-down-in')
    title.showModal()
  })

  element.addEventListener('click', () => {
    if (!dialog.open) {
      animate(dialog, 'slide-up-in')
      animate(title, 'slide-up-out', () => { title.close() })
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
