import { Keys } from './keys.js'

const localStorage = window.localStorage
const name = 'settings-window'
const settings = document.getElementsByName(name)
const windowHeight = document.getElementById('settings-window-height')
const windowWidth = document.getElementById('settings-window-width')
const bounds = [windowHeight, windowWidth]

const Values = Object.freeze({
  custom: 'custom',
  fullscreen: 'fullscreen',
  maximized: 'maximized'
})

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
  localStorage.setItem(Keys.window, value)

  windowHeight.disabled = windowWidth.disabled = !(value === Values.custom)

  if (value === Values.custom) {
    if (Number(windowHeight.value)) {
      localStorage.setItem(Keys.windowHeight, windowHeight.value)
    }
    if (Number(windowWidth.value)) {
      localStorage.setItem(Keys.windowWidth, windowWidth.value)
    }
  }

  // When running in electron, send a request to update the window
  window.electron?.resizeWindow(value, getBounds())
}

settings.forEach((element) => {
  element.addEventListener('change', function () {
    if (this.checked) {
      update(this.value)
    }
  })
})

if (window.electron?.resizeWindow) {
  bounds.forEach((element) => {
    element.addEventListener('change', function () {
      if (!this.disabled) {
        update(Values.custom)
      }
    })
  })
}

window.electron?.onWindowResized((bounds) => {
  if (getValue() === Values.custom) {
    // Keep window dimensions in sync with window size if resizing manually
    windowHeight.value = bounds.height
    windowWidth.value = bounds.width
  }
})

update(getValue())
