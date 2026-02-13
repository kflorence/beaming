import { animate } from './util.js'

const title = document.getElementById('dialog-title')
const screen = document.getElementById('screen')

function getElement () {
  return title.open ? title : screen
}

document.querySelectorAll('[data-dialog]').forEach((target) => {
  const id = target.dataset.dialog
  const dialog = document.getElementById(id)
  if (!dialog) {
    console.warn(`No matching dialog found for ID: ${id}`)
    return
  }

  const close = dialog.querySelector('header button')
  close.addEventListener('click', async () => {
    const element = getElement()
    const direction = element?.id === title.id ? 'right' : 'left'
    const promises = [() => animate(dialog, `slide-${direction}-out`, () => { dialog.close() })]
    console.log(element)
    if (element) {
      promises.push(() => animate(element, `slide-${direction}-in`, () => { element.showModal?.() }))
    }
    await Promise.all(promises.map((promise) => promise()))
  })

  target.addEventListener('click', async () => {
    if (!dialog.open) {
      const element = getElement()
      const direction = element?.id === title.id ? 'left' : 'right'
      const promises = [
        () => animate(dialog, `slide-${direction}-in`, () => {
          dialog.showModal()
          dialog.dispatchEvent(new CustomEvent('opened'))
        })
      ]
      if (element) {
        promises.push(() => animate(element, `slide-${direction}-out`, () => { element.close?.() }))
      }
      await Promise.all(promises.map((promise) => promise()))
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
