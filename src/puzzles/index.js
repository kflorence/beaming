import _001 from './001'
import _002 from './002'
import _003 from './003'
import _004 from './004'
import _005 from './005'
import _006 from './006'
import _007 from './007'
import _008 from './008'
import _009 from './009'
import _010 from './010'

// These are just for testing purposes
// They won't show up in the list but are accessible via URL
import testLayout from './testLayout'
import testPortal from './testPortal'
import testReflector from './testReflector'
import testInfiniteLoop from './testInfiniteLoop'

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
  '009': _009,
  '010': _010,
  test_infinite_loop: testInfiniteLoop,
  test_layout: testLayout,
  test_portal: testPortal,
  test_reflector: testReflector
}).map(([k, v]) => [k, JSON.parse(JSON.stringify(v))]))

function traverse (ids, id, amount) {
  const index = ids.indexOf(id)
  return ids[index < 0 ? index : index + amount]
}

class PuzzleGroup {
  ids

  constructor (ids) {
    this.firstId = ids[0]
    this.ids = ids
    this.lastId = ids[ids.length - 1]
  }

  get (id) {
    if (this.has(id)) {
      // Note: deep cloning configuration to prevent mutation
      return structuredClone(configuration[id])
    }
  }

  has (id) {
    return this.ids.includes(id)
  }

  nextId (id) {
    return traverse(this.ids, id, 1)
  }

  previousId (id) {
    return traverse(this.ids, id, -1)
  }
}

export const Puzzles = new PuzzleGroup(Object.keys(configuration).sort())

Puzzles.hidden = new PuzzleGroup(Puzzles.ids.filter((id) => id.startsWith('test_')))
Puzzles.titles = Object.fromEntries(Puzzles.ids.map((id) => [id, configuration[id].title || id]))
Puzzles.visible = new PuzzleGroup(Puzzles.ids.filter((id) => !Puzzles.hidden.has(id)))
