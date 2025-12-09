import { emitEvent, getKey } from './util.js'

const localStorage = window.localStorage

export class Storage {
  static delete (key, persist = true) {
    if (key === undefined) {
      localStorage.clear()
    } else {
      localStorage.removeItem(key)
    }

    emitEvent(Storage.Events.Delete, { key, persist })
  }

  static get (key) {
    return key === undefined ? { ...localStorage } : localStorage.getItem(key)
  }

  static set (key, value, persist = true) {
    if (typeof key === 'object') {
      if (typeof value === 'boolean') {
        persist = value
      }

      for (const [k, v] of Object.entries(key)) {
        Storage.#set(k, v)
      }
    } else {
      Storage.#set(key, value)
    }

    emitEvent(Storage.Events.Set, { key, value, persist })
  }

  static #set (key, value) {
    localStorage.setItem(key, (typeof value === 'function' ? value() : value).toString())
  }

  static Key = 'storage'
  static Events = Object.freeze({
    Delete: getKey(Storage.Key, 'delete'),
    Set: getKey(Storage.Key, 'set')
  })
}
