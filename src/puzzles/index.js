// noinspection JSFileReferences
import * as puzzles from './*.json'
import { State } from '../components/state.js'

export class Puzzles {
  static ids = Object.keys(puzzles).sort()
  static titles = Object.fromEntries(Puzzles.ids.map((id) => [id, puzzles[id].title ?? id]))

  static get (id) {
    if (Puzzles.has(id)) {
      // Note: deep cloning puzzles to prevent mutation
      return structuredClone(puzzles[id])
    }
  }

  static has (id) {
    return Puzzles.ids.includes(id)
  }

  static imports () {
    const currentId = State.getId()
    const ids = Array.from(new Set(Puzzles.ids.concat(State.getIds().filter((id) => id !== currentId))))
    const titles = ids.map((id) => Puzzles.titles[id] ?? State.fromCache(id)?.getTitle() ?? id)
    return { ids, titles }
  }
}
