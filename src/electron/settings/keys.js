const cache = 'cache'
const settings = 'settings'
const window = 'window'

function key () {
  return Array.from(arguments).join(':')
}

export const Keys = Object.freeze({
  cacheClear: key(settings, cache, 'clear'),
  cacheCleared: key(settings, cache, 'cleared'),
  window: key(settings, window),
  windowHeight: key(settings, window, 'height'),
  windowWidth: key(settings, window, 'width')
})
