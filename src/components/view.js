import paper from 'paper'
import { State } from './state'
import { Storage } from './storage'
import { emitEvent, getKeyFactory, pointToString, sizeToString, stringToPoint } from './util'

export class View {
  static getCenter () {
    let data = Storage.get(View.#key(View.CacheKeys.Center))
    if (data !== null) {
      data = JSON.parse(data)
      if (sizeToString(paper.view.viewSize) === data.size) {
        // In order to use the center point from cache, the view size must match the cached view size
        return stringToPoint(data.point)
      }
    }
    return null
  }

  static getZoom () {
    const zoom = Storage.get(View.#key(View.CacheKeys.Zoom))
    return zoom === null ? zoom : Number(zoom)
  }

  static setCenter (point) {
    paper.view.center = point
    if (State.getId() !== null) {
      const data = { size: sizeToString(paper.view.viewSize), point: pointToString(point) }
      Storage.set(View.#key(View.CacheKeys.Center), JSON.stringify(data))
    }
    emitEvent(View.Events.Center, { point })
  }

  static setZoom (factor) {
    paper.view.zoom = factor
    if (State.getId() !== null) {
      Storage.set(View.#key(View.CacheKeys.Zoom), factor.toString())
    }
  }

  static update () {
    const center = View.getCenter()
    if (center !== null) {
      paper.view.center = center
    }

    const zoom = View.getZoom()
    if (zoom !== null) {
      paper.view.zoom = zoom
    }
  }

  static CacheKeys = Object.freeze({
    Center: 'center',
    Zoom: 'zoom'
  })

  static Events = Object.freeze({
    Center: 'view-center'
  })

  static #key = getKeyFactory([State.getContext, 'puzzle', State.getId, 'view'])
}
