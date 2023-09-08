export class Modifiable {
  constructor(modifiers) {
    this.modifiers = modifiers
  }

  has (modifier) {
    return this.modifiers.includes(modifier)
  }
}
