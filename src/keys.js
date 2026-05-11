// This file is depended on across web and electron. It should have no dependencies, just static keys
const settings = 'settings'
const window = 'window'

function key () {
  return Array.from(arguments).join(':')
}

export const Keys = Object.freeze({
  debug: 'debug',
  window: key(settings, window),
  windowHeight: key(settings, window, 'height'),
  windowWidth: key(settings, window, 'width')
})

export const Values = Object.freeze({
  custom: 'custom',
  defaultWindowHeight: '768',
  defaultWindowWidth: '1024',
  fullscreen: 'fullscreen',
  maximized: 'maximized'
})
