export class Cache {
  #cache = {}
  #hasKeys
  #keys

  constructor (keys = []) {
    this.#keys = keys
    this.#hasKeys = keys.length !== 0

    keys.forEach((key) => { this.#cache[key] = new Cache() })
  }

  set (key, item) {
    if (this.#hasKeys && !this.#keys.includes(key)) {
      throw new Error(`Invalid key: ${key}`)
    }

    this.#cache[key] = item
  }

  get (key) {
    return key === undefined ? this.#cache : this.#cache[key]
  }

  keys (key) {
    return Object.keys(this.#get(key))
  }

  length (key) {
    return this.keys(key).length
  }

  unset (key) {
    delete this.#cache[key]
  }

  values (key) {
    return Object.values(this.#get(key))
  }

  #get (key) {
    const value = this.get(key)
    return value instanceof Cache ? value.get() : value
  }
}
