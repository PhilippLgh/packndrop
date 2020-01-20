import fs from 'fs'
import path from 'path'
import url, { UrlWithStringQuery } from 'url'
import os from 'os'
import { parseArgsFromUrl } from '../../utils'
import PackageLoader from '../..'
import { useSplashToDetectWebContents, createSplashUpdater } from './Splash'
import { IRelease } from 'ethpkg/dist/Repositories/IRepository'

// used for remote zip (experimental)
/*
async function getZipUrl(_url : string){
  let result = await request("HEAD", _url);
  let headers = result.headers;
  if (headers.status === "302 Found" && headers.location) {
    return headers.location
  }
  return _url
}
*/

/*
const showSplashAndDetectWebContents = (handler: any, repoUrl: string, targetVersion?: string): Promise<{ webContents: Electron.WebContents, emitUpdate: (update: string) => void }> => new Promise(async (resolve, reject) => {
  // hack: id is used for window detection to get a mapping from app to window
  const windowId = Math.random().toString(26).slice(2)
  const windowTitle = `Package: ${windowId}`

  // this will listen for title changes on all webContents
  findWebContentsByTitle(windowTitle).then(webContents => {
    const emitUpdate = (update: string) => {
      webContents.executeJavaScript(`
      try {
        window.dispatchEvent(new CustomEvent('update', {detail: ${update} }));
      } catch (error) {
        console.error(error)
      }
    `)
    }
    resolve({ webContents, emitUpdate })
  })

  // load the splash screen content this should trigger the above detector
  // FIXME await showSplash(handler, windowTitle, repoUrl, targetVersion)
})
*/

const hotLoadProtocolHandler = async (requestUrl: string, handler: any) => {

  const args = parseArgsFromUrl(requestUrl)
  const { resourcePath, hostname, normalizedPathname, targetVersion } = args

  // console.log('received request for resource', resourcePath)

  if (!hostname) {
    console.log('FATAL: could not parse hostname from request', requestUrl)
    // https://code.google.com/p/chromium/codesearch#chromium/src/net/base/net_error_list.h
    return handler(-2)
  }

  if (!normalizedPathname) {
    console.log('FATAL: could not parse pathname from request', requestUrl)
    return handler(-2)
  }

  // if .mod domain it means a package was fetched, cached and loaded
  // this can be considered a virtual host that exists as package in memory
  // --> try to load resource from cached package
  // console.log('serve resource from package', hostname, normalizedPathname)

  const loader = new PackageLoader()

  if (hostname.endsWith('.mod')) {
    console.log('forward request to virtual host')
    const content = await loader.getResource(hostname, normalizedPathname)
    return handler(content || -2)
  } else {
    console.log('received request for unavailable module:', resourcePath)
    const _webContents = await useSplashToDetectWebContents((splash: string) => {
      // provide the splash screen with a render function
      let result = handler({ mimeType: 'text/html', data: Buffer.from(splash) })
    })

    // TODO provide app info
    // TODO use updater to update download progress
    const updater = createSplashUpdater(_webContents)

    // caching strategy: cache, update and refresh (optional)
    // serve release from cache if possible -> for fast start
    // check and download (always) newer version in background
    // display info of newer version if it exists on remote
    // user can then restart or will have the update on next start
    // see https://serviceworke.rs/strategy-cache-update-and-refresh.html

    const repoUrl = `https://${resourcePath}`

    // onlyCache skips any requests to servers and just displays what we have cached
    let appUrl = undefined // FIXME await loader.loadApp(repoUrl, { onlyCache: true, version: targetVersion })
    // if nothing is cached we manually need to fallback and search for remote releases
    if (!appUrl) {
      appUrl = await loader.loadApp(repoUrl, { version: targetVersion, onProgress: (progress: number, release: IRelease) => {
        updater({ progress, release })
      }})
    }
    if(!appUrl) {
      // TODO display error
      return handler(-2)
    }

    console.log('package ready: redirect to virtual hostname / url', appUrl)
    // redirect requesting web contents to new virtual host
    _webContents.loadURL(appUrl)

    // TODO trigger updater:
    /**
    checkForAppUpdatesAndNotify({
      version: targetVersion,
      download: true,
      dialogs: true
    })
     */

  }

  // webContents.openDevTools({ mode: 'detach' })
}

let isRegistered = false
/**
 * TODO things to consider:
 * this is *magic* and magic is usually not a good thing
 * it will overwrite other interceptors - it seems there can only be one which might be a bug
 * this will only allow to read from one package which is probably intended
 * it will also completely deactivate fs access for files outside the package which could be a good thing 
 */
export const registerPackageProtocol = async () : Promise<boolean> => {
  const { protocol, app } = require('electron')

  const scheme = 'package'
  // FIXME cacheDir = _cacheDir ? _cacheDir : cacheDir

  if (isRegistered) {
    return false
  }

  /**
   // https://github.com/electron/electron/blob/master/docs/api/protocol.md 
    By default web storage apis (localStorage, sessionStorage, webSQL, indexedDB, cookies) are disabled
    for non standard schemes. 
    So in general if you want to register a custom protocol to replace the http protocol, 
    you have to register it as a standard scheme.
    -> needs to be registered before app.onReady / app.isReady
  */
  // @ts-ignore
  if (protocol.registerStandardSchemes && typeof protocol.registerStandardSchemes === 'function') {
    // @ts-ignore
    protocol.registerStandardSchemes([scheme], { secure: true })
  } else {
    protocol.registerSchemesAsPrivileged([
      { scheme: scheme, privileges: { standard: true, secure: true } }
    ])
  }

  await app.whenReady()

  protocol.registerBufferProtocol(scheme, (request : any, cb: (buffer?: Buffer) => void) => {
    hotLoadProtocolHandler(request.url, cb)
  })

  isRegistered = true

  return true
}
