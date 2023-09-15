import { Modifiers, Types } from '../components/util'

export default {
  connections: 1,
  layout: {
    tiles: [
      [null, null, {}, null],
      [null, {}, null, null],
      [null, {}, null, null]
    ],
    tileSize: 100
  },
  items: [
    {
      beams: [2],
      color: 'blue',
      modifiers: [Modifiers.Locked, Modifiers.Toggleable],
      offsetCoordinates: [0, 2],
      openings: [4],
      type: Types.Terminus
    },
    {
      beams: [5],
      color: 'blue',
      modifiers: [Modifiers.Locked, Modifiers.Toggleable],
      offsetCoordinates: [2, 1],
      openings: [1],
      type: Types.Terminus
    }
  ]
}
