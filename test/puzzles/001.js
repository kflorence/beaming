/* eslint-env mocha */

require('chromedriver')
const assert = require('assert')
const { Builder, By, until } = require('selenium-webdriver')
const chrome = require('selenium-webdriver/chrome')

describe('Puzzle 001', function () {
  let body
  let driver
  let puzzle

  async function hasClass (element, name) {
    const classes = (await element.getAttribute('class')).split(' ')
    assert(classes.some((className) => name === className))
  }

  async function clickModifier (name) {
    const modifier = await driver.findElement(By.className(`modifier-${name}`))
    const actions = driver.actions({ async: true })
    await actions.move({ origin: modifier }).click().perform()
  }

  async function selectTile (r, c) {
    const [x, y] = await driver.executeScript(`return beaming.getTileOffsetPosition(${r}, ${c})`)

    const actions = driver.actions({ async: true })
    await actions.move({ origin: puzzle, x, y }).click().perform()

    const modifiers = await driver.findElement(By.id('modifiers-mutable'))
    await driver.wait(until.elementIsVisible(modifiers), 2000)
  }

  after(async function () {
    if (driver) {
      await driver.quit()
    }
  })

  before(async function () {
    const options = new chrome.Options()
    options.addArguments(
      '--headless=new',
      '--window-size=1920,1080'
    )
    driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build()
    await driver.get('http://localhost:1234')
    body = await driver.findElement(By.tagName('body'))
    puzzle = await driver.findElement(By.id('puzzle'))
  })

  it('should be solvable', async function () {
    await selectTile(2, 0)
    await clickModifier('toggle')
    await hasClass(body, 'puzzle-solved')
  })
})
