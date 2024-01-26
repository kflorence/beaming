import paper, { Point } from 'paper'
import { Cache } from './cache'
import { EventListeners } from './eventListeners'

export class Interact {
  #bounds
  #cache = new Cache(Object.values(Interact.CacheKeys))
  #element
  #eventListener = new EventListeners({ context: this })
  #offset

  constructor (element) {
    this.#bounds = element.getBoundingClientRect()
    this.#element = element
    this.#offset = new Point(this.#bounds.left, this.#bounds.top)
    this.#eventListener.add([
      { type: 'pointercancel', handler: this.onPointerUp },
      { type: 'pointerdown', handler: this.onPointerDown },
      { type: 'pointerleave', handler: this.onPointerUp },
      { type: 'pointermove', handler: this.onPointerMove },
      { type: 'pointerout', handler: this.onPointerUp },
      { type: 'pointerup', handler: this.onPointerUp },
      { type: 'wheel', handler: this.onMouseWheel, options: { passive: false } }
    ], { element })
  }

  onMouseWheel (event) {
    event.preventDefault()
    this.#zoom(new Point(event.offsetX, event.offsetY), event.deltaY, 1.05)
  }

  onPan (event) {
    const point = paper.view.viewToProject(Interact.point(event))
    const pan = this.#getGesture(Interact.GestureKeys.Pan)

    if (!pan) {
      this.#setGesture(Interact.GestureKeys.Pan, { from: point })
      return
    }

    const center = pan.from.subtract(point).add(paper.view.center)

    // Allow a little wiggle room to prevent panning on tap
    if (paper.view.center.subtract(center).length > 1) {
      if (!document.body.classList.contains('grab')) {
        document.body.classList.add('grab')
      }

      // Center on the cursor
      paper.view.center = center
    }
  }

  onPinch (events) {
    const pointer0 = events[0]
    const pointer1 = events[1]

    const point0 = Interact.point(pointer0)
    const point1 = Interact.point(pointer1)
    const distance = point0.getDistance(point1)

    const pinch = this.#getGesture(Interact.GestureKeys.Pinch)
    if (!pinch) {
      this.#setGesture(Interact.GestureKeys.Pinch, { distance })
      return
    }

    const center = point0.add(point1).divide(2).subtract(this.#offset)
    const scale = distance / pinch.distance
    const delta = (pinch.distance - distance) * scale

    this.#zoom(center, delta, 1.01)

    pinch.distance = distance
  }

  onPointerDown (event) {
    this.#cache.get(Interact.CacheKeys.Down).set(event.pointerId, event)
  }

  onPointerMove (event) {
    const down = this.#cache.get(Interact.CacheKeys.Down).get(event.pointerId)
    if (!down) {
      // Ignore events until there is a pointer down event
      return
    }

    // For some reason pointermove fires on mobile even if there was no movement
    const diff = Interact.point(event).subtract(Interact.point(down)).length
    if (diff > 1) {
      this.#cache.get(Interact.CacheKeys.Move).set(event.pointerId, event)

      const events = this.#cache.get(Interact.CacheKeys.Move).values()
      if (events.length === 2) {
        this.onPinch(events)
      } else {
        this.onPan(event)
      }
    }
  }

  onPointerUp (event) {
    const down = this.#cache.get(Interact.CacheKeys.Down).get(event.pointerId)
    if (!down) {
      return
    }

    if (
      this.#cache.length(Interact.CacheKeys.Down) === 1 &&
      !this.#cache.get(Interact.CacheKeys.Move).get(event.pointerId)
    ) {
      this.onTap(down)
    }

    document.body.classList.remove('grab')

    this.#cache.get(Interact.CacheKeys.Down).unset(event.pointerId)
    this.#cache.get(Interact.CacheKeys.Move).unset(event.pointerId)
    this.#cache.get(Interact.CacheKeys.Gesture).unset(Interact.GestureKeys.Pan)

    if (this.#cache.length(Interact.CacheKeys.Move) < 2) {
      this.#cache.get(Interact.CacheKeys.Gesture).unset(Interact.GestureKeys.Pinch)
    }
  }

  onTap (event) {
    const point = paper.view.viewToProject(Interact.point(event).subtract(this.#offset))
    this.#element.dispatchEvent(new CustomEvent(Interact.GestureKeys.Tap, { detail: { event, point } }))
  }

  #getGesture (key) {
    return this.#cache.get(Interact.CacheKeys.Gesture).get(key)
  }

  #setGesture (key, value) {
    this.#cache.get(Interact.CacheKeys.Gesture).set(key, value)
  }

  #zoom (point, delta, factor) {
    const zoom = Math.max(
      Math.min(
        delta < 0 ? paper.view.zoom * factor : paper.view.zoom / factor,
        Interact.maxZoom
      ),
      Interact.minZoom
    )

    // Convert the touch point from the view coordinate space to the project coordinate space
    const touchPoint = paper.view.viewToProject(point)
    const touchOffset = touchPoint.subtract(paper.view.center)

    // Adjust center towards cursor location
    const zoomOffset = touchPoint
      .subtract(touchOffset.multiply(paper.view.zoom / zoom))
      .subtract(paper.view.center)

    paper.view.zoom = zoom
    paper.view.center = paper.view.center.add(zoomOffset)
  }

  static point (event) {
    return new Point(event.clientX, event.clientY)
  }

  static CacheKeys = Object.freeze({
    Down: 'down',
    Move: 'move',
    Gesture: 'gesture'
  })

  static GestureKeys = Object.freeze({
    Pan: 'pan',
    Pinch: 'pinch',
    Tap: 'tap'
  })

  static maxZoom = 2
  static minZoom = 0.5
  static vibratePattern = 25
}
