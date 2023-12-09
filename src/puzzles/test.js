const layout = [
  ['o', 'o', 'x', 'x', 'x'],
  ['x', 'x', 'o'],
  ['x', 'x', 'o']
]

export default {
  connectionsRequired: 1,
  title: 'Test',
  layout: layout.map((column) => column.map((item) => item === 'x' ? { type: 'Tile' } : null))
}
