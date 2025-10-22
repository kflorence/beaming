const { contextBridge, ipcRenderer } = require('electron')

const localStorage = window.localStorage

function init () {
  document.body.classList.add('electron')
  document.getElementById('title-quit').addEventListener('click', () => {
    ipcRenderer.send('quit')
  })
  const fullscreen = document.getElementById('fullscreen')
  fullscreen.addEventListener('click', () => {
    ipcRenderer.send('fullscreen', fullscreen.checked)
  })
  console.log('fullscreen', localStorage.getItem('settings:fullscreen'))
  // TODO refactor settings so it can be referenced here
  ipcRenderer.send('fullscreen', localStorage.getItem('settings:fullscreen') === 'true')
}

contextBridge.exposeInMainWorld('electron', { init })
