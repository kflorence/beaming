import '@fontsource-variable/material-symbols-outlined'
import '@fontsource-variable/material-symbols-outlined/fill.css'
import '@fontsource-variable/noto-sans-mono'

import './dialog'
import './settings'

import { Game } from './components/game'
import pkg from '../package.json'

if (process.env.NODE_ENV === 'production') {
  require('./analytics')
}

// Set build version from package.json
document.getElementById('version').textContent = `v${pkg.version}`

// Execute initialization if running inside electron
window.electron?.init()

// Export
window.game = new Game()
