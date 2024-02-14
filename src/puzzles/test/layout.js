// TODO: this file can be removed when the puzzle editor is created
const layout = [
  ['o', 'x', 'x', 'x'],
  ['x', 'x', 'x', 'x'],
  ['x', 'x', 'x', 'x', 'x'],
  ['x', 'x', 'x', 'x'],
  ['o', 'x', 'x', 'x']
]

export default {
  layout: {
    tiles: layout.map((column) => column.map((item) => item === 'x' ? { type: 'Tile' } : null))
    // type: 'even-r'
  },
  solution: [
    { amount: 100, type: 'Connections' }
  ]
}
