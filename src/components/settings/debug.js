import { params } from '../util.js'
import { debug } from '../debug.js'
import { Keys } from '../../keys.js'

const $debug = document.getElementById('settings-debug')
$debug.checked = params.has(Keys.debug)

$debug.addEventListener('change', () => {
  debug($debug.checked)
})
