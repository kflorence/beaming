require('chromedriver')
const chrome = require('selenium-webdriver/chrome')
const { Builder, By } = require('selenium-webdriver')

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

    this.driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build()
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
      actions[options.right ? 'contextClick' : 'click']()
    }
    await actions.perform()
  }

  async clickTile (r, c) {
    // Center on the tile we want to click on. This ensures it is visible
    await this.driver.executeScript(`return beaming.centerOnTile(${r}, ${c})`)
    await this.driver.actions({ async: true }).move({ origin: this.elements.canvas }).click().perform()
  }

  async isSolved () {
    return hasClass(this.elements.body, 'puzzle-solved')
  }

  async selectModifier (name) {
    const origin = this.#getModifier(name)
    await this.driver.actions({ async: true }).move({ origin }).press().pause(500).release().perform()
  }

  async #getModifier (name) {
    return await this.driver.findElement(By.className(`modifier-${name}`))
  }

  static baseUrl = 'http://localhost:1234'
}

async function hasClass (element, name) {
  const classes = (await element.getAttribute('class')).split(' ')
  return classes.some((className) => name === className)
}

module.exports = {
  PuzzleFixture
}
