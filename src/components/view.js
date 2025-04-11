import paper from 'paper'
import { State } from './state'
import { emitEvent, getKeyFactory, params, pointToString, sizeToString, stringToPoint } from './util'

const localStorage = window.localStorage

export class View {
  static getCenter () {
    return localStorage.getItem(View.#key(State.getId(), sizeToString(paper.view.viewSize), View.CacheKeys.Center))
  }

  static getZoom () {
    return localStorage.getItem(View.#key(State.getId(), View.CacheKeys.Zoom))
  }

  static setCenter (point) {
    paper.view.center = point
    if (State.getId() !== null) {
      localStorage.setItem(
        View.#key(State.getId(), sizeToString(paper.view.viewSize), View.CacheKeys.Center), pointToString(point))
    }
    emitEvent(View.Events.Center, { point })
  }

  static setZoom (factor) {
    paper.view.zoom = factor
    if (State.getId() !== null) {
      localStorage.setItem(View.#key(State.getId(), View.CacheKeys.Zoom), factor.toString())
    }
  }

  static update () {
    const center = View.getCenter()
    if (center !== null) {
      paper.view.center = stringToPoint(center)
    }

    const zoom = View.getZoom()
    if (zoom !== null) {
      paper.view.zoom = Number(zoom)
    }
  }

  static CacheKeys = Object.freeze({
    Center: 'center',
    Zoom: 'zoom'
  })

  static Events = Object.freeze({
    Center: 'view-center'
  })

  static #key = getKeyFactory([
    // Prefix key with 'editor' when in edit mode
    params.has(State.ParamKeys.Edit) ? State.CacheKeys.Editor : undefined,
    'view'
  ].filter((v) => v))
}
