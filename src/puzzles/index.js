import one from './01'
import two from './02'
import three from './03'
import four from './04'
import five from './05'
import six from './06'
import seven from './07'
import eight from './08'

// Ensure puzzle configuration is valid JSON
const configuration = Object.fromEntries(Object.entries({
  '01': one,
  '02': two,
  '03': three,
  '04': four,
  '05': five,
  '06': six,
  '07': seven,
  '08': eight
}).map(([k, v]) => [k, JSON.parse(JSON.stringify(v))]))

function traverse (id, amount) {
  const index = Puzzles.ids.indexOf(id)
  return Puzzles.ids[index < 0 ? index : index + amount]
}

export class Puzzles {
  static ids = Object.keys(configuration)
  static firstId = Puzzles.ids[0]
  static lastId = Puzzles.ids[Puzzles.ids.length - 1]

  static get (id) {
    // Ensure we return a deep clone of the configuration to ensure any mutations downstream will not end up in
    // subsequent calls to this method.
    return structuredClone(configuration[id])
  }

  static has (id) {
    return Object.hasOwn(configuration, id)
  }

  static nextId (id) {
    return traverse(id, 1)
  }

  static previousId (id) {
    return traverse(id, -1)
  }
}
