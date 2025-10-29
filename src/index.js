import './dialog'
import './settings'

import { Game } from './components/game'

if (process.env.NODE_ENV === 'production') {
  require('./analytics')
}

// Execute initialization if running inside electron
window.electron?.init()

// Export
window.game = new Game()
