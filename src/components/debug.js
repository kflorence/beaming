import { params } from './util'

const console = window.console = window.console || { debug: function () {} }
const consoleDebug = console.debug

export function debug (debug) {
  console.debug = debug ? consoleDebug : function () {}
}

// Silence debug logging by default
debug(params.has('debug') ?? false)
