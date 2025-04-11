import { params } from './util'

const console = window.console = window.console || { debug: function () {} }
const consoleDebug = console.debug
const enabled = params.has('debug')

if (enabled) {
  document.body.classList.add('debug')
}

export function debug (debug) {
  console.debug = debug ? consoleDebug : function () {}
}

debug.enabled = enabled
debug(enabled)
