require('chromedriver')
const chrome = require('selenium-webdriver/chrome')
const { Builder, By, until, WebElementCondition } = require('selenium-webdriver')

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
      '--headless=new',
      '--ignore-certificate-errors',
      '--window-size=768,1024'
    )

    console.log('Building driver...')
    this.driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build()

    console.log(`Getting URL: ${this.url}`)
    await this.driver.get(this.url)

    this.elements.body = await this.driver.findElement(By.tagName('body'))
    this.elements.canvas = await this.driver.findElement(By.id('puzzle'))
    this.elements.modifiers = await this.driver.findElement(By.id('modifiers-mutable'))
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

  async isSolved () {
    return elementHasClass(this.elements.body, 'puzzle-solved')
  }

  async selectModifier (name) {
    const origin = this.#getModifier(name)
    await this.driver.actions({ async: true }).move({ origin }).press().pause(500).release().perform()
  }

  async #getModifier (name) {
    await this.driver.wait(until.elementIsVisible(this.elements.modifiers))
    return await this.driver.findElement(By.className(`modifier-${name}`))
  }

  static baseUrl = 'http://localhost:1234'
}

function elementHasClass (element, name) {
  return new WebElementCondition('until element has class', function () {
    return element.getAttribute('class').then((classes) => classes.split(' ').some((className) => name === className))
  })
}

module.exports = {
  PuzzleFixture
}
