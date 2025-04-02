import paper from 'paper'
import { State } from './state'
import { emitEvent, getKeyFactory, params, pointToString, stringToPoint } from './util'

const localStorage = window.localStorage

export class View {
  static setCenter (point) {
    paper.view.center = point
    localStorage.setItem(View.#key(View.CacheKeys.Center), pointToString(point))
    emitEvent(View.Events.Center, { point })
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
    'view',
    State.getId()
  ].filter((v) => v))
}
