import _001 from './001'
import _002 from './002'
import _003 from './003'
import _004 from './004'
import _005 from './005'
import _006 from './006'
import _007 from './007'
import _008 from './008'
import _999 from './999'

// Ensure puzzle configuration is valid JSON
const configuration = Object.fromEntries(Object.entries({
  '001': _001,
  '002': _002,
  '003': _003,
  '004': _004,
  '005': _005,
  '006': _006,
  '007': _007,
  '008': _008,
  999: _999
}).map(([k, v]) => [k, JSON.parse(JSON.stringify(v))]))

function traverse (id, amount) {
  const index = Puzzles.ids.indexOf(id)
  return Puzzles.ids[index < 0 ? index : index + amount]
}

export class Puzzles {
  static ids = Object.keys(configuration).sort()
  static firstId = Puzzles.ids[0]
  static lastId = Puzzles.ids[Puzzles.ids.length - 1]
  static titles = Object.fromEntries(Puzzles.ids.map((id) => [id, configuration[id].title || id]))

  static get (id) {
    // Ensure we return a deep clone of the configuration to ensure any mutations downstream will not end up in
    // subsequent calls to this method.
    return structuredClone(configuration[id])
  }

  static has (id) {
    return Object.hasOwn(configuration, id)
  }

  static nextId (id) {
    return traverse(id, 1)
  }

  static previousId (id) {
    return traverse(id, -1)
  }
}
