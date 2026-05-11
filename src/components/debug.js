import { params } from './util'
import { Keys } from '../keys.js'

export function debug (debug) {
  if (debug) {
    params.set(Keys.debug, '')
  } else {
    params.delete(Keys.debug)
  }

  document.body.classList.toggle(Keys.debug, debug)
}

debug(params.has(Keys.debug))
