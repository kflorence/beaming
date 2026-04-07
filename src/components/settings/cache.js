import { confirm } from '../dialog.js'
import { emitEvent } from '../util.js'

const $reset = document.getElementById('settings-cache-reset')

export const Events = Object.freeze({
  CacheClear: 'cache-clear'
})

$reset.addEventListener('click', () => {
  confirm('Are you sure you want to reset cache? This cannot be undone.', () => {
    emitEvent(Events.CacheClear)
  })
})
