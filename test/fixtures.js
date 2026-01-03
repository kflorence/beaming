import 'chromedriver'
import chrome from 'selenium-webdriver/chrome.js'
import { Builder, By, Condition, logging, until } from 'selenium-webdriver'

logging.installConsoleHandler()

const logger = logging.getLogger('')
logger.setLevel(logging.Level.DEBUG)

export function removeKeys (obj, keys) {
  if (!obj || typeof obj !== 'object') {
    return obj
  }

  if (!Array.isArray(keys)) {
    keys = [keys]
  }

  Object.keys(obj).forEach((key) => {
    if (keys.includes(key)) {
      delete obj[key]
    } else {
      removeKeys(obj[key], keys)
    }
  })

  return obj
}

export class PuzzleFixture {
  driver
  elements = {}

  constructor (id, mode = 'play') {
    this.after = this.after.bind(this)
    this.before = this.before.bind(this)
    this.url = `${PuzzleFixture.baseUrl}/?${mode}#/${id}`
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
      // '--headless',
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

    // Wait for the puzzle to be ready
    await this.driver.wait(untilElementHasClass(this.elements.body, 'puzzle-loaded'))
  }

  async clickAtOffset (r, c) {
    console.log(`Clicking at offset: ${r}, ${c}`)
    // Center on the point first to ensure it is visible
    await this.driver.executeScript(`return game.puzzle.centerOn(${r}, ${c})`)
    const origin = await this.getElement('canvas.active')
    console.log(await origin.getAttribute('id'))
    return this.driver.actions({ async: true }).move({ origin }).click().perform()
  }

  async clickElement (selector) {
    console.log(`Clicking on element: ${selector}`)
    const origin = await this.getElement(selector)
    return this.driver.actions({ async: true }).move({ origin }).click().perform()
  }

  async clickTile (r, c, onlyIfNotSelected = false) {
    // Center on the tile we want to click on. This ensures it is visible
    const isSelected = await this.driver.executeScript(`return game.puzzle.centerOnTile(${r}, ${c})`)
    if (!isSelected || !onlyIfNotSelected) {
      // Only click on an already selected tile if onlyIfNotSelected is false
      const origin = await this.getElement('canvas.active')
      return this.driver.actions({ async: true }).move({ origin }).click().perform()
    }

    return Promise.resolve()
  }

  async getEditorState () {
    const state = await this.driver.executeScript('return game.editor.getState()')
    console.log('Got editor state:', JSON.stringify(state, null, 2))
    return state
  }

  async getElement (selector) {
    return this.driver.wait(until.elementLocated(By.css(selector)))
  }

  async getModifier (name) {
    return this.driver.wait(until.elementLocated(By.css(`.modifier-${name.toLowerCase()}:not(.disabled)`)))
  }

  async isMasked () {
    return this.driver.wait(untilElementHasClass(this.elements.body, 'puzzle-mask'))
  }

  async isNotMasked () {
    return this.driver.wait(untilElementDoesNotHaveClass(this.elements.body, 'puzzle-mask'))
  }

  async invokeModifier (name, options = {}) {
    const times = options.times ?? 1
    for (let i = 0; i < times; i++) {
      // Need to re-get modifier each time as location might change
      const origin = await this.getModifier(name)
      const actions = this.driver.actions({ async: true }).move({ origin })
      actions.press(options.button).release(options.button)
      await actions.perform()
    }
  }

  async isSolved () {
    return this.driver.wait(untilElementHasClass(this.elements.body, 'puzzle-solved'))
  }

  async process (action) {
    console.log('processing action', JSON.stringify(action))
    switch (action.type) {
      case 'modifier-invoke': {
        await this.invokeModifier(action.modifier, action.options || {})
        break
      }
      case 'tile-click': {
        await this.clickTile(...action.tile.split(','))
        break
      }
      case 'tile-select': {
        await this.selectTile(...action.tile.split(','))
        break
      }
      case 'wait': {
        switch (action.for) {
          case 'mask-hidden': {
            await this.isNotMasked()
            break
          }
          case 'mask-visible': {
            await this.isMasked()
            break
          }
        }
        break
      }
      default: {
        throw new Error(`unrecognized action type: ${action.type}`)
      }
    }
  }

  async selectOption (selector, value) {
    const element = await this.getElement(selector)
    return await element.sendKeys(value)
  }

  async selectTile (r, c) {
    await this.clickTile(r, c, true)
    return this.driver.wait(untilElementHasClass(this.elements.body, `tile-selected_${r}_${c}`))
  }

  async solve (actions) {
    for (const action of actions) {
      await this.process(action)
    }
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
