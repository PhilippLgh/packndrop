import { assert } from 'chai'
import { BrowserWindow, ipcMain } from "electron"
import { findWebContentsByTitle } from '../../../src/strategies/electron/utils'

import * as testUtils from './utils'

describe('utils', () => {
  describe('findWebContentsByTitle = (windowTitle: string, timeout: number): Promise<WebContents>', function() {
    // TODO remove the timeout 
    this.timeout(30*1000)

    it('detects BrowserWindows', async () => {
      const title = '1234'
      const window = testUtils.displayHtml({ title })
      const _webContents = await findWebContentsByTitle(title)
      assert.isDefined(_webContents)
      const _title = _webContents.getTitle()
      assert.equal(_title, title)
      window.close()
    })

    it.skip('detects WebViews', async () => {
      const title = 'find me'
      const webviewHtml = testUtils.getHtmlUrl({ title })
      const body = `
        <webview id="webview" style="display:inline-flex; width:100%; height:400px; border: 2px red dotted;"></webview>
        <script>
          const view = document.getElementById('webview')
          view.src = \`${webviewHtml}\`
          console.log('webview title', view.getTitle())
        </script>
      `
      // https://electronjs.org/docs/api/webview-tag#enabling
      const window = new BrowserWindow({
        webPreferences: {
          webviewTag: true
        }
      })
      const html = testUtils.getHtmlUrl({ body })
      window.loadURL(html)
      // we need to wait for parent document or the webviewtag's webcontent might not be created when we call findWebContentsByTitle
      await testUtils.eventPromise('did-stop-loading', window)
      const _webContents = await findWebContentsByTitle(title)
      assert.isDefined(_webContents)
      const _title = _webContents.getTitle()
      assert.equal(_title, title)
      window.close()
    })

    it.skip('detects BrowserViews', async () => {})

    it('does NOT detect IFrames', async () => {
      // WON'T FIX: iframes have no associated webContents object
      // https://github.com/electron/electron/issues/14091
      // https://electronjs.org/docs/api/web-contents#webcontentsgetallwebcontents
      // This will contain web contents for all windows, webviews, opened devtools, and devtools extension background pages.
      const title = 'find the iframe'
      const iframeHtml = testUtils.getHtmlUrl({ title, body: '<h1>hello parent</h1>' })
      const body = `
        <iframe id="frame" style="display:inline-flex; width:100%; height:400px; border: 2px red dotted;"></iframe>
        <script>
          const view = document.getElementById('frame')
          view.src = \`${iframeHtml}\`
        </script>
      `
      const window = new BrowserWindow()
      const html = testUtils.getHtmlUrl({ body })
      window.loadURL(html)
      await testUtils.eventPromise('did-stop-loading', window)
      // reaches timeout after 5
      try {
        await findWebContentsByTitle(title, 5*1000)
        assert.fail('should throw timeout')
      } catch (error) {
        assert.isDefined(error)
      }
    })

  })
})
