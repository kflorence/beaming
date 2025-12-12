import SteamworksSDK from 'steamworks-ffi-node'

export default class Steam {
  #interval
  #sdk

  appId = 4172230

  constructor () {
    this.#sdk = SteamworksSDK.default.getInstance()
  }

  setup () {
    if (this.#sdk.init({ appId: this.appId })) {
      this.#interval = setInterval(this.#sdk.runCallbacks.bind(this.#sdk), 1000)
    }

    console.debug(Steam.toString('setup'), this.#sdk.getStatus())
  }

  teardown () {
    if (this.#interval === undefined) {
      return
    }

    clearInterval(this.#interval)
    this.#interval = undefined
    this.#sdk.shutdown()
  }

  static toString () {
    return '[' + ['Steam', ...arguments].join(':') + ']'
  }
}
