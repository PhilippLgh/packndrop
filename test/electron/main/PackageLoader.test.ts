import { assert } from 'chai'
import PackageLoader from '../../../src/PackageLoader'
import * as utils from '../../../src/utils'

describe('PackageLoader', () => {

  describe.only('async loadApp(appUrl: string) : Promise<PackageURL>', function(){

    this.timeout(60 * 1000)

    it('runs in electron', async () => {
      const inElectron = utils.isElectron()
      assert.isTrue(inElectron, 'not running in electron')
    })

    it('downloads a package from ipfs', async () => {
      const loader = new PackageLoader()
      const appUrl = 'https://github.com/ethereum/remix-ide'
      const pkg = await loader.loadApp(appUrl)
      console.log('pkg', pkg)
      assert.isDefined(pkg)

      const iframe = document.createElement("iframe")
    })

    it.only('caches modules and does not load the twice', async () => {
      const loader = new PackageLoader()
      const app = await loader.loadApp('https://github.com/ethereum/grid-ui', {
        onProgress: () => {
          console.log('progress called')
        }
      })


    })


    /*
    it('loads a packaged application into memory and returns a url for [electron, webview, browser, service worker]', async () => {
      const appUrl = 'https://github.com/ethereum/remix-ide'
      const packageLoader = new PackageLoader()
      const newUrl = await packageLoader.loadApp(appUrl)
      assert.equal(newUrl, 'package:///13abaa4a205eae802b635640a11b4a3e.mod/index.html')
    })

    it('all instances of PackageLoader share a static module registry', async () => {
      const appUrl = 'https://github.com/ethereum/remix-ide'
      const packageLoader = new PackageLoader()
      const newUrl = await packageLoader.loadApp(appUrl)
      assert.equal(newUrl, 'package:///13abaa4a205eae802b635640a11b4a3e.mod/index.html')
      const packageLoader2 = new PackageLoader()
      const hostname = '13abaa4a205eae802b635640a11b4a3e.mod'
      const mod = packageLoader2.getModule(hostname)
      assert.isDefined(mod)
    })
    */

    // it allows to load a url like `package://github.com/ethereum/grid-ui?version=${version}` in electron

  })

  describe('static async registerPackageProtocol() : Promise<?>', function(){
    // 'package://github.com/ethereum/remix-ide'
    // const remixIdeUrl = 'package://a7df6d3c223593f3550b35e90d7b0b1f.mod'
  })
  

})
