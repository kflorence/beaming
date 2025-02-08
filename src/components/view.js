import paper from 'paper'
import { State } from './state'
import { getKeyFactory, pointToString, stringToPoint } from './util'

const localStorage = window.localStorage

export class View {
  static setCenter (point) {
    paper.view.center = point
    localStorage.setItem(View.#key(View.CacheKeys.Center), pointToString(point))
  }

  static setZoom (factor) {
    paper.view.zoom = factor
    localStorage.setItem(View.#key(View.CacheKeys.Zoom), factor.toString())
  }

  static update () {
    const center = localStorage.getItem(View.#key(View.CacheKeys.Center))
    if (center !== null) {
      paper.view.center = stringToPoint(center)
    }

    const zoom = localStorage.getItem(View.#key(View.CacheKeys.Zoom))
    if (zoom !== null) {
      paper.view.zoom = Number(zoom)
    }
  }

  static #key = getKeyFactory(State.getId(), 'view')

  static CacheKeys = Object.freeze({
    Center: 'center',
    Zoom: 'zoom'
  })
}
