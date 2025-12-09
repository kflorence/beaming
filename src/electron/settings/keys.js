const settings = 'settings'
const window = 'window'

function key () {
  return Array.from(arguments).join(':')
}

export const Keys = Object.freeze({
  window: key(settings, window),
  windowHeight: key(settings, window, 'height'),
  windowWidth: key(settings, window, 'width')
})
