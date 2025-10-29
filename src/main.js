const { app, BrowserWindow, ipcMain } = require('electron/main')
const path = require('path')

const channels = Object.freeze({
  quit: 'quit',
  resizeWindow: 'resize-window'
})

// Disable default menus
// Menu.setApplicationMenu(null)

let window
function createWindow () {
  window = new BrowserWindow({
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

  window.on('resize', onWindowResize)
}

function onWindowResize () {
  window.webContents.send('window-resized', window.getBounds())
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

ipcMain.on(channels.quit, () => {
  app.quit()
})

ipcMain.on(channels.resizeWindow, (event, value, settings) => {
  window.setFullScreen(value === 'fullscreen')

  // FIXME: fullscreen is asynchronous, so need to handle this after transition completes
  if (value === 'maximized') {
    window.maximize()
  } else if (window.isMaximized()) {
    window.unmaximize()
  }

  if (value === 'custom') {
    const bounds = {
      height: Number(settings.height),
      width: Number(settings.width)
    }

    if (!bounds.height) {
      delete bounds.height
    }

    if (!bounds.width) {
      delete bounds.width
    }

    // FIXME: establish min/max values
    console.log('custom', bounds)
    window.setBounds(bounds)
  }
})
