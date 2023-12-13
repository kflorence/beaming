import * as jsonDiffPatchFactory from 'jsondiffpatch'
import pako from 'pako'

export const jsonDiffPatch = jsonDiffPatchFactory.create({ objectHash: deepEqual })

window.jsonDiffPatch = jsonDiffPatch

export const MouseButton = Object.freeze({
  Left: 0,
  Right: 2
})

export function addClass (className, ...elements) {
  elements.forEach((element) => element.classList.add(className))
}

export function addDegrees (original, degrees) {
  const result = original + degrees
  if (result < 0) return 360 + result
  else if (result > 360) return result - 360
  return result
}

export function capitalize (string) {
  return string.charAt(0).toUpperCase() + string.slice(1)
}

export function coalesce (...args) {
  return args.findLast((arg) => arg !== undefined)
}

export function colorElement (color) {
  const span = document.createElement('span')
  span.classList.add('beam')
  span.style.backgroundColor = color
  span.textContent = color
  return span
}

/**
 * Calls the given function one time after a task has finished for the given amount of time.
 * @param func the function to call
 * @param delay the time to wait after the task has completed
 * @returns {(function(...[*]): void)|*}
 */
export function debounce (func, delay = 500) {
  let timeout
  return (...args) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => {
      func(...args)
    }, delay)
  }
}

export function base64decode (string) {
  const binString = window.atob(base64unescape(string))
  // noinspection JSCheckFunctionSignatures
  return new TextDecoder().decode(pako.inflate(Uint8Array.from(binString, (c) => c.codePointAt(0))))
}

window.base64decode = base64decode

export function base64encode (string) {
  return base64escape(window.btoa(String.fromCodePoint(...pako.deflate(new TextEncoder().encode(string)))))
}

window.base64encode = base64encode

function base64escape (string) {
  // https://en.wikipedia.org/wiki/Base64#URL_applications
  return string.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

function base64unescape (string) {
  return (string + '==='.slice((string.length + 3) % 4))
    .replace(/-/g, '+').replace(/_/g, '/')
}

export function deepEqual (x, y) {
  return typeof x === 'object' && typeof y === 'object'
    ? (
        Object.keys(x).length === Object.keys(y).length && (
          typeof x.equals === 'function' ? x.equals(y) : Object.keys(x).every(key => deepEqual(x[key], y[key])))
      )
    : (x === y)
}

export function emitEvent (event, detail = null) {
  document.dispatchEvent(new CustomEvent(event, { detail }))
}

export function fuzzyEquals (pointA, pointB, maxDiff = 2) {
  return pointA && pointB && pointA.ceil().subtract(pointB.floor()).length <= maxDiff
}

export function getCentroid (triangle) {
  const segments = triangle.segments
  const vertex = segments[0].point
  const opposite = segments[1].point.subtract(segments[1].point.subtract(segments[2].point).divide(2))
  return vertex.add(opposite.subtract(vertex).multiply(2 / 3))
}

export function getMidPoint (pointA, pointB) {
  const vector = pointA.subtract(pointB)
  vector.length = vector.length / 2
  return pointA.subtract(vector)
}

export function getNextDirection (direction, max = 5) {
  return direction === max ? 0 : direction + 1
}

export function getOppositeDirection (direction) {
  return direction + (direction >= 3 ? -3 : 3)
}

// Normalize the direction. Currently, directions correspond to points in the hexagon as PaperJS draws it, with the
// first point (direction zero) corresponding to direction 4 in the cube system. May want to revisit this at some
// point when standardizing directions across everything.
// See: http://paperjs.org/tutorials/geometry/vector-geometry/
// TODO: may want to consider updating directions across this project to something more uniform
export function getConvertedDirection (direction, toPaperJs = true) {
  direction = direction + (toPaperJs ? -1 : 1) * 2
  if (direction < 0) return direction + 6
  else if (direction > 5) return direction - 6
  return direction
}

export function getReflectedDirection (beamDirection, reflectorDirection) {
  // Have to convert to PaperJS directions on the way in
  const beamAngle = getConvertedDirection(beamDirection, true) * 60
  const reflectorAngle = reflectorDirection * 30
  const reflectedBeamAngle = (reflectorAngle - beamAngle) * 2
  // And convert back to our normal directions on the way out
  return getConvertedDirection((addDegrees(beamAngle, reflectedBeamAngle) / 60) % 6, false)
}

export function removeClass (className, ...elements) {
  elements.forEach((element) => element.classList.remove(className))
}

export function sortByDistance (point) {
  return (a, b) => a.subtract(point).length - b.subtract(point).length
}
