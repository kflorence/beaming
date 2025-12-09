// This file is sandboxed, so it has limited access to modules.
// See: https://www.electronjs.org/docs/latest/tutorial/sandbox#preload-scripts
import { contextBridge, ipcRenderer } from 'electron'
import channels from './channels.js'
import { Keys } from './settings/keys.js'

const localStorage = window.localStorage

class Store {
  static async get (key) {
    return ipcRenderer.invoke(channels.storeGet, key)
  }

  static async set (key, value) {
    return ipcRenderer.invoke(channels.storeSet, key, value)
  }
}

async function init () {
  document.body.classList.add('electron')

  // Update from cache
  resizeWindow(
    localStorage.getItem(Keys.window), {
      height: localStorage.getItem(Keys.windowHeight),
      width: localStorage.getItem(Keys.windowWidth)
    }
  )

  const store = await Store.get()
  for (const [key, value] of Object.entries(store)) {
    // Update localStorage from file cache
    localStorage.setItem(key, value.toString())
  }
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

// Expose in the renderer under window.electron
contextBridge.exposeInMainWorld('electron', {
  init,
  onWindowResized,
  quit,
  resizeWindow,
  Store
})
