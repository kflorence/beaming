import './dialog'

import { Game } from './components/game'

if (process.env.NODE_ENV === 'production') {
  require('./analytics')
}

// This will only exist when running from an electron app
window.electron?.init()

// Export
window.game = new Game()
