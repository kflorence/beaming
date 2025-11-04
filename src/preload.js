const { contextBridge, ipcRenderer } = require('electron')

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
  ipcRenderer.on('window-resized', (event, ...args) => { handler(...args) })
}

function quit () {
  ipcRenderer.send('quit')
}

function resizeWindow () {
  ipcRenderer.send('resize-window', ...Array.from(arguments))
}

// Expose in the renderer under window.electron
contextBridge.exposeInMainWorld('electron', {
  init,
  onWindowResized,
  quit,
  resizeWindow
})
