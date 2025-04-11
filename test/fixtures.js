require('chromedriver')
const chrome = require('selenium-webdriver/chrome')
const { Builder, By, Condition, logging, until, Button } = require('selenium-webdriver')

logging.installConsoleHandler()

const logger = logging.getLogger('')
logger.setLevel(logging.Level.DEBUG)

class PuzzleFixture {
  driver
  elements = {
    body: undefined,
    canvas: undefined,
    modifiers: undefined
  }

  constructor (id) {
    this.after = this.after.bind(this)
    this.before = this.before.bind(this)
    this.url = `${PuzzleFixture.baseUrl}/#/${id}`
  }

  async after () {
    if (this.driver) {
      await this.driver.quit()
    }
  }

  async before () {
    const options = new chrome.Options()
    options.addArguments(
      '--disable-dev-shm-usage',
      '--disable-extensions',
      '--disable-gpu',
      // Comment this out to watch the tests run in-browser
      '--headless',
      '--ignore-certificate-errors',
      '--no-sandbox',
      '--window-size=768,1024'
    )

    console.log('Building driver...')
    this.driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options)
      .build()

    console.log(`Getting URL: ${this.url}`)
    await this.driver.get(this.url)

    this.elements.body = await this.driver.findElement(By.tagName('body'))
    this.elements.canvas = await this.driver.findElement(By.id('puzzle'))
    this.elements.modifiers = await this.driver.findElement(By.id('puzzle-footer-menu'))
  }

  async clickModifier (name, options = {}) {
    const times = options.times ?? 1
    const origin = this.#getModifier(name)
    const actions = this.driver.actions({ async: true }).move({ origin })
    for (let i = 0; i < times; i++) {
      actions.press(options.button).release(options.button)
    }
    await actions.perform()
  }

  async clickTile (r, c) {
    // Center on the tile we want to click on. This ensures it is visible
    await this.driver.executeScript(`return beaming.centerOnTile(${r}, ${c})`)
    await this.driver.actions({ async: true }).move({ origin: this.elements.canvas }).click().perform()
  }

  async isMasked () {
    return this.driver.wait(untilElementHasClass(this.elements.body, 'puzzle-mask'))
  }

  async isNotMasked () {
    return this.driver.wait(untilElementDoesNotHaveClass(this.elements.body, 'puzzle-mask'))
  }

  async isSolved () {
    return this.driver.wait(untilElementHasClass(this.elements.body, 'puzzle-solved'))
  }

  async solve (moves) {
    for (const move of moves) {
      switch (move.eventType) {
        case 'mask-hidden': {
          await this.isNotMasked()
          break
        }
        case 'masked-visible': {
          await this.isMasked()
          break
        }
      }
      if (move.tile) {
        const [r, c] = move.tile.split(',')
        await this.clickTile(r, c)
      }
      if (move.modifierType) {
        await this.clickModifier(
          move.modifierType,
          move.eventType === 'modifier-toggled' ? { button: Button.MIDDLE } : {}
        )
      }
      if (move.selectedTile) {
        const [r, c] = move.selectedTile.split(',')
        await this.clickTile(r, c)
      }
    }
  }

  async #getModifier (name) {
    await this.driver.wait(until.elementIsVisible(this.elements.modifiers))
    return await this.driver.findElement(By.css(`.modifier-${name.toLowerCase()}:not(.disabled)`))
  }

  static baseUrl = 'http://localhost:1234'
}

function untilElementHasClass (element, name) {
  return new Condition('until element has class', function () {
    return element.getAttribute('class').then((classes) => classes.split(' ').some((className) => name === className))
  })
}

function untilElementDoesNotHaveClass (element, name) {
  return new Condition('until element does not have class', function () {
    return element.getAttribute('class').then((classes) => classes.split(' ').every((className) => name !== className))
  })
}

module.exports = {
  PuzzleFixture
}
