const layout = [
  ['x', 'x'],
  ['x', 'x', 'x'],
  ['x', 'x']
]

export default {
  layout: {
    tiles: layout.map((column) => column.map((item) => item === 'x' ? { type: 'Tile' } : null)),
    type: 'even-r'
  },
  solution: {
    connections: 100
  }
}
