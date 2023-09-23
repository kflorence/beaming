export const Buttons = Object.freeze({
  Left: 0,
  Right: 2
})

export const Events = Object.freeze({
  Error: 'puzzle-error',
  ItemModified: 'puzzle-item-modified',
  Solved: 'puzzle-solved',
  TileSelected: 'puzzle-tile-selected'
})

export const Messages = Object.freeze({
  ErrorInvalidId: 'Error: invalid puzzle ID'
})

export function getReflectedDirection (beamDirection, reflectorDirection) {
  const beamAngle = beamDirection * 60
  const reflectorAngle = reflectorDirection * 30
  const reflectedBeamAngle = (reflectorAngle - beamAngle) * 2
  return (addDegrees(beamAngle, reflectedBeamAngle) / 60) % 6
}

export function getNextDirection (direction, max = 5) {
  return direction === max ? 0 : direction + 1
}

export function getOppositeDirection (direction) {
  return direction + (direction >= 3 ? -3 : 3)
}

export function addDegrees (original, degrees) {
  const result = original + degrees
  if (result < 0) return 360 + result
  else if (result > 360) return result - 360
  return result
}
