const puzzles = {
  '001': require('./001.json'),
  '002': require('./002.json'),
  '003': require('./003.json'),
  '004': require('./004.json'),
  '005': require('./005.json'),
  '006': require('./006.json'),
  '007': require('./007.json'),
  '008': require('./008.json'),
  '009': require('./009.json'),
  '010': require('./010.json'),
  '011': require('./011.json'),
  test_infinite_loop: require('./test/infiniteLoop.json'),
  test_layout: require('./test/layout'),
  test_portal: require('./test/portal.json'),
  test_reflector: require('./test/reflector.json')
}

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
      // Note: deep cloning puzzles to prevent mutation
      return structuredClone(puzzles[id])
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

export const Puzzles = new PuzzleGroup(Object.keys(puzzles).sort())

Puzzles.hidden = new PuzzleGroup(Puzzles.ids.filter((id) => id.startsWith('test_')))
Puzzles.titles = Object.fromEntries(Puzzles.ids.map((id) => [id, puzzles[id].title || id]))
Puzzles.visible = new PuzzleGroup(Puzzles.ids.filter((id) => !Puzzles.hidden.has(id)))
