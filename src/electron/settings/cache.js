import { emitEvent } from '../../components/util.js'
import Tippy from 'tippy.js'
import { Keys } from './keys.js'

const confirm = window.confirm
const $dialog = document.getElementById('dialog-settings')
const $reset = document.getElementById('settings-cache-reset')

const tippy = Tippy($reset, {
  appendTo: $dialog,
  content: 'Cache cleared!',
  placement: 'right',
  theme: 'custom',
  trigger: 'manual'
})

document.addEventListener(Keys.cacheCleared, (event) => {
  console.debug(event.type)
  tippy.show()
  setTimeout(() => tippy.hide(), 1000)
})

$reset.addEventListener('click', () => {
  if (confirm('Are you sure you want to reset cache? This cannot be undone.')) {
    emitEvent(Keys.cacheClear)
  }
})
