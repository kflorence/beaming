import paper from 'paper'
import { State } from './state'
import { getKey, pointToString, stringToPoint } from './util'

const localStorage = window.localStorage

export class View {
  static setCenter (point) {
    paper.view.center = point
    localStorage.setItem(View.#getKey(View.CacheKeys.center), pointToString(point))
  }

  static setZoom (factor) {
    paper.view.zoom = factor
    localStorage.setItem(View.#getKey(View.CacheKeys.zoom), factor.toString())
  }

  static update () {
    const center = localStorage.getItem(View.#getKey(View.CacheKeys.center))
    if (center !== null) {
      paper.view.center = stringToPoint(center)
    }

    const zoom = localStorage.getItem(View.#getKey(View.CacheKeys.zoom))
    if (zoom !== null) {
      paper.view.zoom = Number(zoom)
    }
  }

  static #getKey () {
    return getKey(...arguments, State.getId())
  }

  static CacheKeys = Object.freeze({
    center: 'center',
    zoom: 'zoom'
  })
}
