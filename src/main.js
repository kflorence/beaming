const { app, BrowserWindow } = require('electron/main')

function createWindow () {
  const window = new BrowserWindow({
    width: 800,
    height: 600
  })

  window.loadFile('dist/index.html')
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
