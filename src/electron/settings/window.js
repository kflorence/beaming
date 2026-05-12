import { Keys, Values } from '../../keys.js'

const electron = window.electron
const localStorage = window.localStorage
const store = electron.store

const name = 'settings-window'
const settings = document.getElementsByName(name)
const windowHeight = document.getElementById('settings-window-height')
const windowWidth = document.getElementById('settings-window-width')
const bounds = [windowHeight, windowWidth]
const windowType = localStorage.getItem(Keys.window) ?? Values.custom

windowHeight.value = localStorage.getItem(Keys.windowHeight) ?? Values.defaultWindowHeight
windowWidth.value = localStorage.getItem(Keys.windowWidth) ?? Values.defaultWindowWidth

function getBounds () {
  return {
    height: windowHeight.value,
    width: windowWidth.value
  }
}

function getValue () {
  return document.querySelector(`input[name="${name}"]:checked`).value
}

function update (value) {
  store.set(Keys.window, value)

  windowHeight.disabled = windowWidth.disabled = !(value === Values.custom)

  if (value === Values.custom) {
    if (Number(windowHeight.value)) {
      store.set(Keys.windowHeight, windowHeight.value)
    }
    if (Number(windowWidth.value)) {
      store.set(Keys.windowWidth, windowWidth.value)
    }
  }

  // When running in electron, send a request to update the window
  electron.resizeWindow(value, getBounds())
}

settings.forEach((element) => {
  element.checked = element.value === windowType
  element.addEventListener('change', function () {
    if (this.checked) {
      update(this.value)
    }
  })
})

if (electron.resizeWindow) {
  bounds.forEach((element) => {
    element.addEventListener('change', function () {
      if (!this.disabled) {
        update(Values.custom)
      }
    })
  })
}

electron.onWindowResized((bounds) => {
  if (getValue() === Values.custom) {
    // Keep window dimensions in sync with window size if resizing manually
    windowHeight.value = bounds.height
    windowWidth.value = bounds.width
  }
})

const $steamOverlay = document.getElementById('settings-steam-overlay')
$steamOverlay.checked = localStorage.getItem(Keys.enableSteamOverlay) === 'true'

$steamOverlay.addEventListener('change', () => {
  localStorage.setItem(Keys.enableSteamOverlay, $steamOverlay.checked)
  window.electron?.store.set(Keys.enableSteamOverlay, $steamOverlay.checked)
})
