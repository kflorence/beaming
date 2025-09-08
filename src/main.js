const { app, BrowserWindow, ipcMain } = require('electron/main')
const path = require('path')

// Disable default menus
// Menu.setApplicationMenu(null)

function createWindow () {
  const window = new BrowserWindow({
    // Should match body background color
    backgroundColor: '#ccc',
    height: 768,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    },
    width: 1024
  })

  window.loadFile('dist/index.html')

  window.on('ready-to-show', () => {
    // https://github.com/electron/electron/issues/10572
    window.webContents.setZoomFactor(1)
    window.show()
  })
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

ipcMain.on('quit', () => {
  app.quit()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
