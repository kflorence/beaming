import { AbstractIconLib } from '@json-editor/json-editor/src/iconlib.js'
import { JSONEditor } from '@json-editor/json-editor/src/core.js'

// https://phosphoricons.com/
const mapping = {
  collapse: 'ph-bold ph-caret-down',
  expand: 'ph-bold ph-caret-right',
  delete: 'ph-bold ph-trash',
  edit: 'ph-bold ph-pencil',
  add: 'ph-bold ph-plus',
  subtract: 'ph-bold ph-minus',
  cancel: 'ph-bold ph-x',
  save: 'ph-bold ph-floppy-disk',
  moveup: 'ph-fill ph-arrow-up',
  moveright: 'ph-fill ph-arrow-right',
  movedown: 'ph-fill ph-arrow-down',
  moveleft: 'ph-fill ph-arrow-left',
  copy: 'ph-bold ph-copy',
  clear: 'ph-bold ph-x-circle',
  time: 'ph-bold ph-clock',
  calendar: 'ph-bold ph-calendar',
  edit_properties: 'ph-bold ph-list'
}

export class Phosphor extends AbstractIconLib {
  constructor () {
    super('', mapping)
  }

  static Name = 'phosphor'
}

JSONEditor.defaults.iconlibs[Phosphor.name] = Phosphor
