export const Buttons = Object.freeze({
  Left: 0,
  Right: 2
})

export const Modifiers = Object.freeze({
  Locked: "locked",
  Movable: "movable",
  Rotatable: "rotatable"
})

export function getReflectedDirection (beamDirection, reflectorDirection) {
  const beamAngle = beamDirection * 60
  const reflectorAngle = reflectorDirection * 30
  const reflectedBeamAngle = (reflectorAngle - beamAngle) * 2
  return (addDegrees(beamAngle, reflectedBeamAngle) / 60) % 6
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
