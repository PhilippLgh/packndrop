import { WebContents } from 'electron'

export const findWebContentsByTitle = (windowTitle: string, timeout: number = 20 * 1000): Promise<WebContents> => new Promise((resolve, reject) => {
  const { webContents } = require('electron')
  const _webContents = webContents.getAllWebContents()

  // console.log('webcontents found', _webContents.length)
  for(let webContent of _webContents) {
    if(webContent.getTitle() === windowTitle) {
      return resolve(webContent)
    }
  }

  const assignListeners = (fun: Function) => {
    _webContents.forEach((w: any) => {
      w.on('page-title-updated', fun)
    })
  }

  const removeListeners = (fun: Function) => {
    _webContents.forEach((w: any) => {
      w.removeListener('page-title-updated', fun)
    })
  }

  const rendererDetection = function ({ sender: webContents }: any, title: string) {
    if (title === windowTitle) {
      // found the webContents instance that is rendering the splash:
      removeListeners(rendererDetection)
      resolve(webContents)
    }
  }

  setTimeout(() => {
    removeListeners(rendererDetection)
    reject(new Error('timeout reached to detect title: '+windowTitle))
  }, timeout)

  // we assign a listener to each webcontent to detect where the title changes
  assignListeners(rendererDetection)
})