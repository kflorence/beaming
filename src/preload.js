// This file is sandboxed, so it has limited access to modules.
// See: https://www.electronjs.org/docs/latest/tutorial/sandbox#preload-scripts
import { contextBridge, ipcRenderer } from 'electron'
import channels from './channels.js'

const localStorage = window.localStorage

function init () {
  document.body.classList.add('electron')

  // Update from cache
  resizeWindow(localStorage.getItem('settings:window'), {
    height: localStorage.getItem('settings:window:height'),
    width: localStorage.getItem('settings:window:width')
  })
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

const store = {
  get: function (key) {
    // TODO
    // return ipcRenderer.invoke()
  }
}

// Expose in the renderer under window.electron
contextBridge.exposeInMainWorld('electron', {
  init,
  onWindowResized,
  quit,
  resizeWindow,
  store
})
