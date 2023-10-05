export const Buttons = Object.freeze({
  Left: 0,
  Right: 2
})

export const Messages = Object.freeze({
  ErrorInvalidId: 'Error: invalid puzzle ID'
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

export function getReflectedDirection (beamDirection, reflectorDirection) {
  const beamAngle = beamDirection * 60
  const reflectorAngle = reflectorDirection * 30
  const reflectedBeamAngle = (reflectorAngle - beamAngle) * 2
  return (addDegrees(beamAngle, reflectedBeamAngle) / 60) % 6
}
