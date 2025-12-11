import '@fontsource-variable/material-symbols-outlined'
import '@fontsource-variable/material-symbols-outlined/fill.css'
import '@fontsource-variable/noto-sans-mono'
import 'tippy.js/dist/tippy.css'

import './dialog'

import { Game } from './components/game'
import pkg from '../package.json'

if (process.env.TARGET === 'electron') {
  import('./electron/settings.js')
} else if (process.env.NODE_ENV === 'production') {
  import('./analytics')
}

// Set build version from package.json
document.getElementById('version').textContent = `v${pkg.version}`

async function init () {
  if (window.electron) {
    // Wait for electron initialization to complete first
    await window.electron.init()
  }

  window.game = new Game()
}

// Use an immediately invoked function here to get around not being able to use top-level await in browser
(async () => init())()
