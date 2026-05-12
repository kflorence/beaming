import { params } from './util'
import { Keys } from '../keys.js'

const localStorage = window.localStorage

export function debug (debug) {
  if (typeof debug !== 'boolean') {
    return params.has(Keys.debug) || localStorage.getItem(Keys.debug) === 'true'
  }

  document.body.classList.toggle(Keys.debug, debug)
  localStorage.setItem(Keys.debug, debug.toString())
  window.electron?.store.set(Keys.debug, debug)
}

debug(debug())
