export const MouseButton = Object.freeze({
  Left: 0,
  Right: 2
})

export function addDegrees (original, degrees) {
  const result = original + degrees
  if (result < 0) return 360 + result
  else if (result > 360) return result - 360
  return result
}

export function capitalize (string) {
  return string.charAt(0).toUpperCase() + string.slice(1)
}

export function emitEvent (event, detail = null) {
  document.dispatchEvent(new CustomEvent(event, { detail }))
}

export function getCentroid (triangle) {
  const segments = triangle.segments
  const vertex = segments[0].point
  const opposite = segments[1].point.subtract(segments[1].point.subtract(segments[2].point).divide(2))
  return vertex.add(opposite.subtract(vertex).multiply(2 / 3))
}

export function getNextDirection (direction, max = 5) {
  return direction === max ? 0 : direction + 1
}

export function getOppositeDirection (direction) {
  return direction + (direction >= 3 ? -3 : 3)
}

// The directions currently used in code for beam/terminus have zero equal to the upper left side of a hexagon.
// PaperJS uses the right side of the hexagon as zero, which is equal to two in our directional system. So we have
// to convert here for any functions that rely on PaperJS vector geometry.
// See: http://paperjs.org/tutorials/geometry/vector-geometry/
// TODO: we may want to consider updating directions across this project to something more uniform
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
