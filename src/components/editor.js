export class Editor {
  id

  #puzzle

  constructor (puzzle, state) {
    this.id = state.getId()
    this.#puzzle = puzzle
    document.body.classList.add(Editor.ClassNames.Edit)
  }

  static ClassNames = Object.freeze({
    Edit: 'edit'
  })
}
