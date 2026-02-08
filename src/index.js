import '@fontsource-variable/noto-sans-mono'
import '@phosphor-icons/web/src/bold/style.css'
import '@phosphor-icons/web/src/fill/style.css'
import 'tippy.js/dist/tippy.css'

import './components/paper.js'
import './components/dialog.js'
import './components/settings.js'

import { Game } from './components/game'
import pkg from '../package.json'

if (process.env.TARGET === 'electron') {
  import('./electron/settings.js')
} else if (process.env.NODE_ENV === 'production') {
  import('./components/analytics.js')
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
