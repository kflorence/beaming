import * as jsonDiffPatchFactory from 'jsondiffpatch'
import deepmerge from 'deepmerge'
import pako from 'pako'
import chroma from 'chroma-js'
import { Point } from 'paper'

const location = window.location

export const params = new URLSearchParams(location.search)
export const sqrt3 = Math.sqrt(3)
export const url = new URL(location)

// noinspection JSCheckFunctionSignatures
export const jsonDiffPatch = jsonDiffPatchFactory.create({ objectHash: deepEqual })

export function addClass (className, ...elements) {
  elements.forEach((element) => element.classList.add(className))
}

export function addDegrees (original, degrees) {
  const result = original + degrees
  if (result < 0) return 360 + result
  else if (result > 360) return result - 360
  return result
}

export function addDirection (direction, amount) {
  return ((direction + amount) + 6) % 6
}

export const arrayMergeOverwrite = (target, source) => source

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

export function capitalize (string) {
  return string.charAt(0).toUpperCase() + string.slice(1)
}

export function coalesce (...args) {
  return args.findLast((arg) => arg !== undefined)
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

export function deepEqual (x, y) {
  return typeof x === 'object' && typeof y === 'object'
    ? (
        Object.keys(x).length === Object.keys(y).length &&
        Object.keys(x).every(key => {
          const xv = x[key]
          const yv = y[key]
          return Object.hasOwn(y, key) &&
            (typeof xv?.equals === 'function' ? xv.equals(yv) : deepEqual(xv, yv))
        })
      )
    : (x === y)
}

export function emitEvent (type, detail = null) {
  document.dispatchEvent(new CustomEvent(type, { detail }))
}

export function fuzzyEquals (pointA, pointB, maxDiff = 0) {
  return pointA && pointB && pointA.round().subtract(pointB.round()).length <= maxDiff
}

export function getColorElement (color) {
  const span = document.createElement('span')
  span.classList.add('color')
  span.style.backgroundColor = color
  span.title = color
  return span
}

export function getColorElements (colors) {
  if (!colors.length) {
    return []
  }

  const color = chroma.average(colors).hex()
  const elements = []

  if (colors.some((other) => other !== color)) {
    const maxColorIndex = colors.length - 1

    colors.forEach((color, index) => {
      elements.push(getColorElement(color))
      if (index < maxColorIndex) {
        const plus = document.createElement('span')
        plus.classList.add('text')
        plus.textContent = '+'
        elements.push(plus)
      }
    })

    const equals = document.createElement('span')
    equals.classList.add('text')
    equals.textContent = '='
    elements.push(equals)
  }

  elements.push(getColorElement(color))

  return elements
}

export function getDistance (point) {
  return (a, b) => a.subtract(point).length - b.subtract(point).length
}

export function getIconElement (name, title) {
  const span = document.createElement('span')
  span.classList.add('icon')
  span.textContent = name
  span.title = title ?? capitalize(name)
  return span
}

export function getKey () {
  return Array.from(arguments).join(':')
}

export function getKeyFactory () {
  const base = arguments
  return function () { return getKey(...base, ...arguments) }
}

export function getPointBetween (pointA, pointB, length = (length) => length / 2) {
  const vector = pointA.subtract(pointB)
  vector.length = typeof length === 'function' ? length(vector.length) : length
  return pointA.subtract(vector)
}

export function getPointFrom (point, length, direction) {
  const vector = new Point(0, 0)
  vector.length = length
  vector.angle = getConvertedDirection(direction) * 60
  return point.add(vector)
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

// Gets the position of the point relative to the line.
// Returns 0 if point is on the line, +1 on one side of the line and -1 on the other.
export function getPosition (line, point) {
  const [a, b] = line; const c = point
  return Math.sign((b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x))
}

export function getReflectedDirection (beamDirection, reflectorDirection) {
  // Have to convert to PaperJS directions on the way in
  const beamAngle = getConvertedDirection(beamDirection, true) * 60
  const reflectorAngle = reflectorDirection * 30
  const reflectedBeamAngle = (reflectorAngle - beamAngle) * 2
  // And convert back to our normal directions on the way out
  return getConvertedDirection((addDegrees(beamAngle, reflectedBeamAngle) / 60) % 6, false)
}

export function getTextElement (text) {
  const span = document.createElement('span')
  span.classList.add('text')
  span.textContent = text.toString()
  return span
}

export function merge (a, b, options) {
  let args

  if (Array.isArray(a)) {
    args = a
    options = b
  } else {
    args = [a, b]
  }

  return deepmerge.all(args, options)
}

export function noop (value) {
  if (value) {
    return value
  }
}

export function pointToString (point) {
  return `${point.x},${point.y}`
}

export function removeClass (className, ...elements) {
  elements.forEach((element) => element.classList.remove(className))
}

export function stringToPoint (string) {
  return new Point(string.split(','))
}

export function subtractDirection (direction, amount) {
  return addDirection(direction, amount * -1)
}

export function uniqueBy (key, array) {
  const values = array.map((value) => value[key])
  return array.filter((value, index) => !values.includes(value[key], index + 1))
}

export function uniqueId () {
  return crypto.randomUUID().split('-')[0]
}
