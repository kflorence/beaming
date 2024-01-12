export class Cache {
  #cache = {}
  #hasKeys
  #keys

  constructor (keys = []) {
    this.#keys = keys
    this.#hasKeys = keys.length !== 0

    keys.forEach((key) => { this.#cache[key] = new Cache() })
  }

  add (key, item) {
    if (this.#hasKeys && !this.#keys.includes(key)) {
      throw new Error(`Invalid key: ${key}`)
    }

    this.#cache[key] = item
  }

  get (key) {
    return key ? this.#cache[key] : this.#cache
  }

  remove (key) {
    delete this.#cache[key]
  }
}
