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
  close.addEventListener('click', async () => {
    await Promise.all([
      animate(dialog, 'slide-down-out', () => { dialog.close() }),
      animate(title, 'slide-down-in', () => { title.showModal() })
    ])
  })

  element.addEventListener('click', async () => {
    if (!dialog.open) {
      await Promise.all([
        animate(dialog, 'slide-up-in', () => {
          dialog.showModal()
          dialog.dispatchEvent(new CustomEvent('open'))
        }),
        animate(title, 'slide-up-out', () => { title.close() })
      ])
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
