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

  static getDom () {
    const currentId = State.getId()
    const processedIds = []

    function addItem (id) {
      if (processedIds.includes(id)) {
        return
      }

      const state = State.fromCache(id)
      const puzzle = puzzles[id] ?? state.getConfig()

      const li = document.createElement('li')
      li.classList.add('puzzle')
      li.classList.toggle('custom', !Puzzles.has(id))
      li.classList.toggle('selected', id === currentId)
      li.classList.toggle('solved', state?.getSolution() !== undefined)
      li.classList.toggle('unlocked', puzzle.unlocked === true || state !== undefined)
      li.dataset.id = id

      const span = document.createElement('span')
      span.classList.add('title')
      span.textContent = Puzzles.titles[id] ?? state.getTitle() ?? id
      li.append(span)

      if (puzzle.layout.imports?.length) {
        const ul = document.createElement('ul')
        ul.classList.add('imports')
        puzzle.layout.imports.forEach((ref) => ul.append(addItem(ref.id)))
        li.append(ul)
      }

      processedIds.push(id)

      return li
    }

    const ids = Array.from(new Set(Puzzles.ids.concat(State.getIds())))
    return ids.map((id) => addItem(id)).filter((element) => element !== undefined)
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

  static updateDom () {
    document.getElementById('play-puzzles').replaceChildren(...Puzzles.getDom())
  }
}
