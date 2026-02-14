import { emitEvent, getKey, uniqueId } from './util.js'

const localStorage = window.localStorage

export class Storage {
  static delete (key = undefined, persist = true) {
    if (key === undefined) {
      localStorage.clear()
    } else {
      key = Storage.key(key)
      localStorage.removeItem(key)
    }

    emitEvent(Storage.Events.Delete, { key, persist })
  }

  static get (key) {
    return key === undefined ? { ...localStorage } : localStorage.getItem(Storage.key(key))
  }

  static key (...values) {
    return getKey(Storage.Prefix, Storage.Profile.getId(), ...values.filter((v) => v !== null && v !== undefined))
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
    localStorage.setItem(Storage.key(key), (typeof value === 'function' ? value() : value).toString())
  }

  static Key = 'storage'

  static Events = Object.freeze({
    Delete: getKey(Storage.Key, 'delete'),
    Set: getKey(Storage.Key, 'set')
  })

  static Keys = Object.freeze({
    Profile: 'profile',
    Profiles: 'profiles'
  })

  static Prefix = 'beaming'

  static Profile = class {
    id
    name

    constructor (name) {
      this.id = uniqueId()
      this.name = name
    }

    static get () {
      const id = Storage.Profile.getId()
      if (id !== null) {
        return Storage.Profiles.get(id)
      }
    }

    static getId () {
      return localStorage.getItem(getKey(Storage.Prefix, Storage.Keys.Profile))
    }
  }

  static Profiles = class {
    static add (name) {
      const profiles = Storage.Profiles.get()
      const profile = new Storage.Profile(name)
      profiles.push(profile)
      localStorage.setItem(getKey(Storage.Prefix, Storage.Keys.Profiles), JSON.stringify(profiles))
      return profile
    }

    static get (id) {
      const profiles = JSON.parse(localStorage.getItem(getKey(Storage.Prefix, Storage.Keys.Profiles)) ?? '[]')
      return id ? profiles.find((profile) => profile.id === id) : profiles
    }

    static remove (id) {
      const profiles = Storage.Profiles.get()
      const index = profiles.findIndex((profile) => profile.id === id)
      if (index < 0) {
        throw new Error(`Invalid profile id: ${id}`)
      }

      const profile = profiles.splice(index, 1)[0]
      localStorage.setItem(getKey(Storage.Prefix, Storage.Keys.Profiles), JSON.stringify(profiles))
      return profile
    }

    static set (id) {
      if (id === Storage.Profiles.Default.id) {
        return Storage.Profiles.unset()
      }

      const profile = Storage.Profiles.get(id)
      if (!profile) {
        throw new Error(`Invalid profile id: ${id}`)
      }

      localStorage.setItem(getKey(Storage.Prefix, Storage.Keys.Profile), id)
      return profile
    }

    static unset () {
      localStorage.removeItem(getKey(Storage.Prefix, Storage.Keys.Profile))
    }

    static Default = new Storage.Profile('default')
  }
}
