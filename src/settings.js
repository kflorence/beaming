import { getKeyFactory } from './components/util'

const elements = Object.freeze({
  fullscreen: document.getElementById('fullscreen'),
  windowHeight: document.getElementById('window-height'),
  windowWidth: document.getElementById('window-width')
})

const localStorage = window.localStorage

const Keys = Object.freeze({
  fullscreen: 'fullscreen',
  settings: 'settings'
})

const key = getKeyFactory(Keys.settings)

function onFullscreenUpdate () {
  elements.windowHeight.disabled = elements.fullscreen.checked
  elements.windowWidth.disabled = elements.fullscreen.checked
}

// Update from cache
elements.fullscreen.checked = localStorage.getItem(key(Keys.fullscreen)) === 'true'
onFullscreenUpdate()

elements.fullscreen.addEventListener('click', () => {
  localStorage.setItem(key(Keys.fullscreen), elements.fullscreen.checked.toString())
  onFullscreenUpdate()
})
