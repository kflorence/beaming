import { Puzzle } from './puzzle'
import { Editor } from './editor'
import paper from 'paper'
import { debug } from './debug'
import { params } from './util'
import { State } from './state'
import { EventListeners } from './eventListeners'

const elements = Object.freeze({
  edit: document.getElementById('title-editor'),
  play: document.getElementById('title-play'),
  title: document.getElementById('dialog-title')
})

export class Game {
  editor
  puzzle

  #eventListeners = new EventListeners({ context: this })

  constructor () {
    this.puzzle = new Puzzle()
    this.editor = new Editor(this.puzzle)

    this.#eventListeners.add([
      { type: 'click', element: elements.edit, handler: this.edit },
      { type: 'click', element: elements.play, handler: this.play }
    ])

    if (params.has(Game.States.Play)) {
      document.body.classList.add(Game.States.Play)
    } else if (params.has(Game.States.Edit)) {
      this.editor.setup()
      document.body.classList.add(Game.States.Edit)
    } else {
      elements.title.showModal()
    }
  }

  edit () {
    if (document.body.classList.contains(Game.States.Edit)) {
      elements.title.close()
      return
    }

    this.#reset()

    document.body.classList.add(Game.States.Edit)

    State.setParam(Game.States.Edit, 'true')

    this.editor.setup()

    elements.title.close()
  }

  play () {
    if (document.body.classList.contains(Game.States.Play)) {
      elements.title.close()
      return
    }

    this.#reset()

    State.setParam(Game.States.Play, 'true')

    this.editor.teardown()
    this.puzzle.resize()

    document.body.classList.add(Game.States.Play)
    elements.title.close()
  }

  #reset () {
    Game.states.forEach((state) => params.delete(state))
    document.body.classList.remove(...Game.states)
  }

  static debug = debug
  static paper = paper

  static States = Object.freeze({
    Edit: State.ParamKeys.Edit,
    Play: State.ParamKeys.Play
  })

  static states = Object.values(Game.States)
}
