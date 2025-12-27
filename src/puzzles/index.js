// noinspection JSFileReferences
import * as puzzles from './*.json'

function traverse (ids, id, amount) {
  const index = ids.indexOf(id)
  return ids[index < 0 ? index : index + amount]
}

class PuzzleGroup {
  ids = []

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

Puzzles.titles = Object.fromEntries(Puzzles.ids.map((id) => [id, puzzles[id].title || id]))
