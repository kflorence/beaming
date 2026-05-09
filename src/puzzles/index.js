// noinspection JSFileReferences
import * as puzzles from './*.json'
import { State } from '../components/state.js'
import { params } from '../components/util.js'

export class Puzzles {
  static ids = Object.keys(puzzles).sort()
  static titles = Object.fromEntries(Puzzles.ids.map((id) => [id, puzzles[id].title ?? id]))

  static get (id) {
    if (Puzzles.has(id)) {
      // Note: deep cloning puzzles to prevent mutation
      return structuredClone(puzzles[id])
    }
  }

  static getDom (context) {
    const currentId = State.getId(context)
    const ids = context === State.ContextKeys.Play
      ? Array.from(new Set(Puzzles.ids.concat(State.getIds(context))))
      : State.getIds(context)
    const processedIds = []

    function addItem (id, parentId) {
      if (processedIds.includes(id)) {
        return
      }

      const state = State.fromCache(id, context)
      const puzzle = state?.getCurrent() ?? puzzles[id]

      if (!puzzle) {
        return
      }

      const custom = !Puzzles.has(id)
      const selected = id === currentId
      const solved = state?.getSolution() !== undefined

      const li = document.createElement('li')
      li.classList.add('puzzle')
      li.classList.toggle('custom', custom)
      li.classList.toggle('selected', selected)
      li.classList.toggle('solved', solved)
      li.classList.toggle('unlocked', Puzzles.isUnlocked(id, context))

      li.dataset.id = id
      if (parentId !== undefined) {
        li.dataset.parentId = parentId
      }

      const div = document.createElement('div')
      div.classList.add('wrapper')
      li.append(div)

      const left = document.createElement('span')
      left.classList.add('flex-left', 'title')

      const title = Puzzles.titles[id] ?? state.getTitle() ?? id
      const idParts = id.split('-')
      left.textContent = title === id ? title : `${idParts.length ? idParts[idParts.length - 1] : id}: ${title}`

      if (selected) {
        const cont = document.createElement('span')
        cont.classList.add('continue')
        cont.textContent = '(Continue)'
        left.append(cont)
      }

      div.append(left)

      const right = document.createElement('span')
      right.classList.add('flex-right', 'icons')

      if (custom) {
        const remove = document.createElement('i')
        remove.classList.add('ph-bold', 'ph-trash', 'remove')
        remove.title = 'Remove from list'
        right.append(remove)
      }

      const status = document.createElement('i')
      status.classList.add('ph-bold', solved ? 'ph-check-circle' : 'ph-circle', 'status')
      status.title = solved ? 'Solved!' : 'Unsolved'
      right.append(status)

      div.append(right)

      if (context === State.ContextKeys.Play && puzzle.layout?.imports?.length) {
        const ul = document.createElement('ul')
        ul.classList.add('imports')
        puzzle.layout.imports.forEach((ref) => ul.append(addItem(ref.id, id)))
        li.append(ul)
      }

      processedIds.push(id)

      return li
    }

    return ids.map((id) => addItem(id)).filter((element) => element !== undefined)
  }

  static getTitle (id) {
    const idParts = id.split('-')
    const title = Puzzles.titles[id]
    return (idParts.length ? idParts[idParts.length - 1] : id) + (title !== id ? `: "${title}"` : '')
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

  static isUnlocked (id, context) {
    // Allow unlocking a puzzle via URL override
    return params.has(State.ParamKeys.Unlock) ||
      // Custom puzzles are always unlocked
      !Puzzles.has(id) ||
      // The puzzle is unlocked by default
      Puzzles.get(id).unlocked ||
      // Puzzles the user has unlocked will have their ID in the getIds entry
      State.getIds(context).includes(id)
  }

  static updateDom (elementId, context) {
    document.getElementById(elementId).replaceChildren(...Puzzles.getDom(context))
  }
}
