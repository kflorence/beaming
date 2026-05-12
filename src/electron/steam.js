import { SteamworksSDK } from 'steamworks-ffi-node'
import { AchievementNames } from '../keys.js'

export default class Steam {
  #interval
  #sdk

  appId = 4172230
  overlayEnabled = false

  constructor () {
    this.#sdk = SteamworksSDK.getInstance()
  }

  setup () {
    if (this.#sdk.init({ appId: this.appId })) {
      this.#interval = setInterval(this.#sdk.runCallbacks.bind(this.#sdk), 1000)
    }

    this.overlayEnabled = this.#sdk.isOverlayAvailable()

    console.debug(Steam.toString('setup'), this.#sdk.getStatus())
  }

  setupOverlay (window) {
    if (!this.overlayEnabled) {
      return
    }

    this.#sdk.addElectronSteamOverlay(window)
    console.debug(Steam.toString('addOverlay'), 'Steam overlay added')
  }

  teardown () {
    if (this.#interval === undefined) {
      return
    }

    clearInterval(this.#interval)
    this.#interval = undefined
    this.#sdk.shutdown()
  }

  async unlockAchievement (name) {
    if (!AchievementNames.includes(name)) {
      throw new Error(`Invalid achievement name: ${name}`)
    }

    let unlocked = await this.#sdk.achievements.isAchievementUnlocked(name)
    if (!unlocked) {
      unlocked = await this.#sdk.achievements.unlockAchievement(name)
      console.debug(Steam.toString('unlockAchievement'), name, unlocked)
    }

    return unlocked
  }

  static toString () {
    return '[' + ['Steam', ...arguments].join(':') + ']'
  }
}
