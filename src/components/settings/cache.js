import { confirm } from '../dialog.js'
import { emitEvent } from '../util.js'
import Tippy from 'tippy.js'

const $dialog = document.getElementById('dialog-settings')
const $reset = document.getElementById('settings-cache-reset')

const tippy = Tippy($reset, {
  appendTo: $dialog,
  content: 'Cache cleared!',
  placement: 'right',
  theme: 'custom',
  trigger: 'manual'
})

export const Events = Object.freeze({
  CacheClear: 'cache-clear',
  CacheCleared: 'cache-cleared'
})

document.addEventListener(Events.CacheCleared, (event) => {
  tippy.show()
  setTimeout(() => tippy.hide(), 1000)
})

$reset.addEventListener('click', () => {
  confirm('Are you sure you want to reset cache? This cannot be undone.', () => {
    emitEvent(Events.CacheClear)
  })
})
