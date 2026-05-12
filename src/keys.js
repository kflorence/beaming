// This file is depended on across web and electron. It should have no dependencies, just static keys
const settings = 'settings'
const window = 'window'

function key () {
  return Array.from(arguments).join(':')
}

// The values should correspond to the values defined in Steam Admin
// https://partner.steamgames.com/apps/achievements/4172230
export const Achievements = Object.freeze({
  FirstSolve: 'ACH_FIRST',
  Edit: 'ACH_EDIT',
  Hex: 'ACH_HEX',
  Infinity: 'ACH_INFINITY',
  Puzzle001: 'ACH_PUZZLE_001'
})

export const AchievementNames = Object.values(Achievements)

export const Keys = Object.freeze({
  debug: 'debug',
  enableSteamOverlay: 'enable-steam-overlay',
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
