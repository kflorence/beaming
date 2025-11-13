const { app, BrowserWindow, ipcMain, Menu, screen } = require('electron/main')
const path = require('path')

const channels = Object.freeze({
  quit: 'quit',
  resizeWindow: 'resize-window'
})

const minHeight = 680
const minWidth = 340

const resizeTypes = Object.freeze({
  custom: 'custom',
  fullscreen: 'fullscreen',
  maximized: 'maximized'
})

// Disable default menus in production builds
if (process.env.NODE_ENV === 'production') {
  Menu.setApplicationMenu(null)
}

let display
let window
function createWindow () {
  display = screen.getPrimaryDisplay()
  window = new BrowserWindow({
    // Should match body background color
    backgroundColor: '#ccc',
    height: 768,
    icon: path.join(__dirname, 'images/icon.png'),
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    },
    width: 1024
  })

  window.loadFile('dist/index.html').catch((e) => {
    console.error('Failed to load file', e)
  })

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

function onResizeWindow (event, value, settings) {
  if (value === resizeTypes.maximized) {
    window.maximize()
  } else if (window.isMaximized()) {
    window.unmaximize()
  }

  if (value === resizeTypes.custom) {
    const displaySize = display.workAreaSize
    const bounds = {
      height: Number(settings.height),
      width: Number(settings.width)
    }

    if (!bounds.height) {
      delete bounds.height
    } else {
      bounds.height = Math.max(minHeight, Math.min(displaySize.height, bounds.height))
    }

    if (!bounds.width) {
      delete bounds.width
    } else {
      bounds.width = Math.max(minWidth, Math.min(displaySize.width, bounds.width))
    }

    window.setBounds(bounds)
  }
}

ipcMain.on(channels.resizeWindow, (event, value, settings) => {
  window.setFullScreen(value === resizeTypes.fullscreen)
  if (window.isFullScreen() && value !== resizeTypes.fullscreen) {
    // On macOS fullscreen transitions are asynchronous, so handle this case asynchronously
    window.once('leave-full-screen', () => onResizeWindow(event, value, settings))
  } else {
    onResizeWindow(event, value, settings)
  }
})
