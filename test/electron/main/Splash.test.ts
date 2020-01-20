import { assert } from 'chai'
import { BrowserWindow, ipcMain } from "electron"
import { useSplashToDetectWebContents, generateSplash, createSplashUpdater } from "../../../src/strategies/electron/Splash"

import * as testUtils from './utils'

const waitForIpc = async (msg: string) => {
  return new Promise((resolve, reject) => {
    ipcMain.on(msg, (event, arg) => {
      resolve()
    })
  })
}


describe('Splash', () => {

  describe(`generateSplash = async (options?: SplashOptions) : Promise<string>`, function() {
    this.timeout(30 * 1000)

    it('generates the html for a splash screen', async () => {
      const splashHtml = await generateSplash()
      assert.isDefined(splashHtml)
      assert.typeOf(splashHtml, 'string')
    })

    it('WARNING: the provided title string will become the title of the browser window ONLY AFTER the document finished loading', async () => {
      const window = new BrowserWindow()
      const title = 'hello browser'
      const splashHtml = await generateSplash({
        windowTitle: title
      })
      window.loadURL(testUtils.getHtmlUrl(splashHtml))
      let _title = window.getTitle()
      assert.equal(_title, 'Electron')
      await testUtils.eventPromise('did-stop-loading', window)
      _title = window.getTitle()
      assert.equal(_title, title)
      window.close()
    })

    // TODO distinguish visual / manual tests and skip on CI
    describe('visual tests', function() {
      this.timeout(30 * 1000)

      it('the splash html can be displayed on a browser window', async () => {
        const splashHtml = await generateSplash({ windowTitle: 'Loading app', repoUrl: 'https://github.com/ethereum/grid-ui' })
        const window = new BrowserWindow()
        window.loadURL(testUtils.getHtmlUrl(splashHtml))
        await testUtils.sleep(10)
        window.close()
      })

      it('the splash html can be displayed on an iframe', async () => {
        const splashHtml = await generateSplash()
        const dataUrl = testUtils.getHtmlUrl(splashHtml)
        const body = `
          <h1>hello iframe</h1>
          <iframe id="frame" height="400" width="600"></iframe>
          <script>
            const frame = document.getElementById('frame')
            frame.src = \`${dataUrl}\`
          </script>
        `
        const window = new BrowserWindow()
        window.loadURL(testUtils.getHtmlUrl({ title: '12345', body }))
        await testUtils.sleep(10)
        window.close()
      })

    })

  })

  describe('createSplashUpdater = (_webContents: WebContents)', () => {
    describe('visual tests', function() {
      this.timeout(30 * 1000)

      it('takes a WebContents object displaying a splash screen and returns a function to update the progress bar on the splash', async () => {
        const window = new BrowserWindow()
        const splashHtml = await generateSplash()
        window.loadURL(testUtils.getHtmlUrl(splashHtml))
        const _webContents = window.webContents
        const update = createSplashUpdater(_webContents)
        let percent = 0
        await new Promise((resolve) => {
          let handler = setInterval(() => {
            update({ progress: percent+=8 })
            if (percent >= 100) {
              clearInterval(handler)
              window.close()
              resolve()
            }
          }, 300)
        })
      })

      it('the displayed app metadata on the splash can be customized', async () => {
        const window = new BrowserWindow()
        const splashHtml = await generateSplash()
        window.loadURL(testUtils.getHtmlUrl(splashHtml))
        const _webContents = window.webContents
        const update = createSplashUpdater(_webContents)
        // TODO check: no updates should be visible here
        await testUtils.sleep(5)
        update({
          appName: 'hello world'
        })
        await testUtils.sleep(5)
        // FIXME app logo (even placeholder) is only rendered on calls to update
        update({
          appName: 'heeeeeelllo world?!',
          version: 'v1.0.0'
        })
        await testUtils.sleep(5)
      })

    })
  })

  describe(`generateSplash = async (windowTitle : string, repoUrl : string, targetVersion = 'latest', service = 'GitHub') : Promise<string>`, function() {
    this.timeout(30 * 1000)

    it('generates the html for a splash screen using a provided title', async () => {
      const splashHtml = await generateSplash()
      assert.isDefined(splashHtml)
      assert.typeOf(splashHtml, 'string')
    })
    // TODO distinguish visual / manual tests and skip on CI
    describe('visual tests', () => {
      it('the splash html can be displayed on a browser window', async () => {
        const window = new BrowserWindow()
        const splashHtml = await generateSplash()
        window.loadURL(testUtils.getHtmlUrl(splashHtml))
        await testUtils.sleep(5)
        window.close()
      })
    })

  })

  describe('useSplashToDetectWebContents = async (showSplash: (splash: string) => void) : Promise<WebContents>', () => {
    it('renders a splash screen with generated id as title to detect the WebContents where the splash is rendered', async () => {
      const window = new BrowserWindow()
      const showSplash = (splash: string) => window.loadURL(testUtils.getHtmlUrl(splash))
      const _webContents = await useSplashToDetectWebContents(showSplash)
      assert.isDefined(_webContents)
      window.close()
    })
    it('detects BrowserWindows', async () => {
      const window = new BrowserWindow()
      const showSplash = (splash: string) => window.loadURL(testUtils.getHtmlUrl(splash))
      const _webContents = await useSplashToDetectWebContents(showSplash)
      assert.isDefined(_webContents)
      window.close()
    })
    it.skip('detects WebViews', async () => {})
    it.skip('detects BrowserViews', async () => {})
    it.skip('detects IFrames', async () => {})
    it.skip('works with multiple WebContents')
    it.skip('detects hidden BrowserWindows')
    it.skip('allows to set a timeout after which the detection fails')
  })

})
