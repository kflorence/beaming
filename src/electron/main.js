import { app, BrowserWindow, ipcMain, Menu, screen } from 'electron/main'
import channels from './channels.js'
import path from 'path'
import { Keys, Values } from '../keys.js'
import Steam from './steam.js'
import Store from 'electron-store'

const __dirname = import.meta.dirname
const args = process.argv.slice(2)
const debug = args.includes('--debug')

const steam = new Steam()

// TODO: consider defining a schema
const store = new Store()

const minHeight = 680
const minWidth = 340
const windowType = store.get(Keys.window)

if (!debug) {
  // Disable default menus when not running in debug mode
  Menu.setApplicationMenu(null)
}

let display
let window
function createWindow () {
  display = screen.getPrimaryDisplay()
  const options = {
    // Should match body background color
    backgroundColor: '#ccc',
    icon: path.join(__dirname, '../images/icon.png'),
    show: false,
    webPreferences: {
      preload: path.join(__dirname, '../../dist/electron/preload.js')
    }
  }

  if (windowType === Values.fullscreen) {
    options.fullscreen = true
  } else {
    options.height = store.get(Keys.windowHeight) ?? Number(Values.defaultWindowHeight)
    options.width = store.get(Keys.windowWidth) ?? Number(Values.defaultWindowWidth)
  }

  window = new BrowserWindow(options)

  if (store.get(Keys.enableSteamOverlay) === true) {
    steam.setupOverlay(window)
  }

  if (windowType === Values.maximized) {
    window.maximize()
  }

  window.loadFile('dist/web/index.html').catch((e) => {
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
  window.webContents.send(channels.windowResized, window.getBounds())
}

ipcMain.handle(channels.debug, () => {
  return debug
})

ipcMain.on(channels.quit, () => {
  app.quit()
})

function onResizeWindow (event, value, settings) {
  if (value === Values.maximized) {
    window.maximize()
  } else if (window.isMaximized()) {
    window.unmaximize()
  }

  if (value === Values.custom) {
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
  window.setFullScreen(value === Values.fullscreen)
  if (window.isFullScreen() && value !== Values.fullscreen) {
    // On macOS fullscreen transitions are asynchronous, so handle this case asynchronously
    window.once('leave-full-screen', () => onResizeWindow(event, value, settings))
  } else {
    onResizeWindow(event, value, settings)
  }
})

ipcMain.handle(channels.steamAchievementUnlock, (event, name) => {
  steam.unlockAchievement(name).catch((reason) => {
    console.error('Failed to unlock achievement', reason)
  })
})

ipcMain.handle(channels.storeDelete, (event, key) => {
  if (key === undefined) {
    store.clear()
  } else {
    store.delete(key)
  }
})

ipcMain.handle(channels.storeGet, (event, key) => {
  return key === undefined ? store.store : store.get(key)
})

ipcMain.handle(channels.storeSet, (event, key, value) => {
  if (typeof key === 'object') {
    store.set(key)
  } else {
    store.set(key, value)
  }
})

app.whenReady().then(() => {
  steam.setup()

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('before-quit', () => {
  steam.teardown()
})

app.on('window-all-closed', () => {
  app.quit()
})
