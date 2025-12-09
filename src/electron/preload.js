// This file is sandboxed, so it has limited access to modules.
// See: https://www.electronjs.org/docs/latest/tutorial/sandbox#preload-scripts
import { contextBridge, ipcRenderer } from 'electron'
import channels from './channels.js'
import { Keys } from './settings/keys.js'

const electron = 'electron'
const localStorage = window.localStorage

const store = {
  delete: async function (key) {
    return ipcRenderer.invoke(channels.storeDelete, key)
  },
  get: async function (key) {
    return ipcRenderer.invoke(channels.storeGet, key)
  },
  set: async function (key, value) {
    return ipcRenderer.invoke(channels.storeSet, key, value)
  }
}

async function debug () {
  return ipcRenderer.invoke(channels.debug)
}

async function init () {
  document.body.classList.add(electron)

  // Update localStorage cache from on-disk cache
  const cache = await store.get()
  for (const [key, value] of Object.entries(cache)) {
    localStorage.setItem(key, value.toString())
  }

  // Update from localStorage cache
  resizeWindow(
    localStorage.getItem(Keys.window), {
      height: localStorage.getItem(Keys.windowHeight),
      width: localStorage.getItem(Keys.windowWidth)
    }
  )
}

function onWindowResized (handler) {
  ipcRenderer.on(channels.windowResized, (event, ...args) => { handler(...args) })
}

function quit () {
  ipcRenderer.send(channels.quit)
}

function resizeWindow () {
  ipcRenderer.send(channels.resizeWindow, ...Array.from(arguments))
}

// Expose to the renderer as window.electron
// See: https://www.electronjs.org/docs/latest/api/context-bridge
contextBridge.exposeInMainWorld(electron, {
  debug,
  init,
  onWindowResized,
  quit,
  resizeWindow,
  store
})
