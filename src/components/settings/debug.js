import { debug } from '../debug.js'
import { Keys } from '../../keys.js'

const localStorage = window.localStorage

const $debug = document.getElementById('settings-debug')
$debug.checked = localStorage.getItem(Keys.debug) === 'true'

$debug.addEventListener('change', () => { debug($debug.checked) })
