import { params } from './util'

export function debug (debug) {
  document.body.classList.toggle('debug', debug)
}

debug(params.has('debug'))
