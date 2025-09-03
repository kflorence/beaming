const { contextBridge, ipcRenderer } = require('electron')

function init () {
  document.body.classList.add('electron')
  document.getElementById('title-quit').addEventListener('click', () => {
    ipcRenderer.send('quit')
  })
}

contextBridge.exposeInMainWorld('electron', { init })
