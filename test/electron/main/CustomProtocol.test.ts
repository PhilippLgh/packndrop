import { assert } from 'chai'
import { isMain } from '../../../src/utils'
import { registerPackageProtocol } from '../../../src/strategies/electron/CustomProtocol'
import axios from 'axios'
import { app, BrowserWindow } from 'electron'
import * as testUtils from './utils'

describe('CustomProtocol', () => {

  // preconditions
  // fail / skip all subsequent if not true
  before(function() {
    assert.isTrue(isMain(), 'tests should run on electrons main process')
    assert.isDefined(require('electron'), 'has access to electron API')
    // we should assume app.isReady will always be true - see notes below
    // const { app } = require('electron')
    // assert.isFalse(app.isReady(), 'electron.app should not be in ready state')
  })

  describe('const registerHotLoadProtocol = (_cacheDir? : string)', function(){
    it('registers a custom protocol handler', async () => {
      // NOTE: the protocol needs to be configured partially before app.ready
      // this cannot be done in tests which is why it is handled separately in SetupProtocolHandler.ts
      // here we only check if it worked
      // see also: https://github.com/jprichardson/electron-mocha/issues/106
      const { protocol } = require('electron')
      const result = await protocol.isProtocolRegistered('package')
      assert.isTrue(result)
    })
    it('the protocol handler cannot be registered twice', async () => {
      const result = await registerPackageProtocol()
      assert.isFalse(result)
    })
    describe('visual tests', function(){

      this.timeout(60 * 1000)

      it('allows to use package:// urls on browser windows', async () => {
        const window = new BrowserWindow()
        window.loadURL('package://github.com/ethereum/grid-ui')
        await testUtils.eventPromise('did-stop-loading', window)
        await testUtils.sleep(20)
        // console.log('result', result)
      })

      it.skip('allows to use package:// urls on webviews', async () => {
        const window = new BrowserWindow()
        window.loadURL('package://github.com/ethereum/grid-ui')
        await testUtils.sleep(60)
        // console.log('result', result)
      })

      it.skip('allows to use package:// urls on multiple webcontents at the same time', async () => {
        const window = new BrowserWindow()
        window.loadURL('package://github.com/ethereum/grid-ui')
        await testUtils.sleep(60)
        // console.log('result', result)
      })

    })

    it.skip('serves package:// requests with content from a dynamically loaded packages', async () => {
      const result = await axios.get('package://github.com/ethereum/grid-ui')
      // console.log('result', result)
    })
  })
})