import { BrowserWindow, ipcMain } from "electron"

/**
 * 
 * Various helpers used in tests
 * 
 * 
 */

export const getHtml = ({ title, body } : any = { title: 'hello test', body: '<h1>hello test runner</h1>'}) => {
  return (`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <meta charset="UTF-8">
      </head>
      <body>
        ${body}
      </body>
    </html>
  `)
}

export const getHtmlUrl = (html: string | object) => 'data:text/html;charset=UTF-8,' + encodeURIComponent(typeof html === 'string' ? html : getHtml(html))

export const displayHtml = (args: any) => {
  const html = getHtmlUrl(args)
  const window = new BrowserWindow()
  window.loadURL(html)
  return window
}

export const sleep = (t: number) => new Promise((resolve, reject) => {
  setTimeout(resolve, t * 1000)
})

export const eventPromise = (name: string, win: BrowserWindow) => new Promise((resolve, reject) => {
  // @ts-ignore
  win.webContents.on(name, resolve)
})