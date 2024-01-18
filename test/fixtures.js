require('chromedriver')
const chrome = require('selenium-webdriver/chrome')
const { Builder, By, until } = require('selenium-webdriver')

class PuzzleFixture {
  driver
  elements = {
    body: undefined,
    canvas: undefined,
    modifiers: undefined
  }

  constructor () {
    this.after = this.after.bind(this)
    this.before = this.before.bind(this)
  }

  async after () {
    if (this.driver) {
      await this.driver.quit()
    }
  }

  async before () {
    const options = new chrome.Options()
    options.addArguments(
      '--headless=new',
      '--window-size=1920,1080'
    )

    this.driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build()
    await this.driver.get('http://localhost:1234')

    this.elements.body = await this.driver.findElement(By.tagName('body'))
    this.elements.canvas = await this.driver.findElement(By.id('puzzle'))
    this.elements.modifiers = await this.driver.findElement(By.id('modifiers-mutable'))
  }

  async clickModifier (name) {
    const modifier = await this.driver.findElement(By.className(`modifier-${name}`))
    const actions = this.driver.actions({ async: true })
    await actions.move({ origin: modifier }).click().perform()
  }

  async isSolved () {
    return hasClass(this.elements.body, 'puzzle-solved')
  }

  async selectTile (r, c) {
    // Center on the tile we want to click on. This ensures it is visible
    await this.driver.executeScript(`return beaming.centerOnTile(${r}, ${c})`)

    const actions = this.driver.actions({ async: true })
    await actions.move({ origin: this.elements.canvas }).click().perform()

    await this.driver.wait(until.elementIsVisible(this.elements.modifiers), 500)
  }
}

async function hasClass (element, name) {
  const classes = (await element.getAttribute('class')).split(' ')
  return classes.some((className) => name === className)
}

module.exports = {
  PuzzleFixture
}
