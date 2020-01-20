import url from 'url'

export const isMain = () => {
  // Main process
  // @ts-ignore Property 'electron' does not exist on type 'ProcessVersions'
  if (typeof process !== 'undefined' && typeof process.versions === 'object' && !!process.versions.electron) {
    return true
  }
  return false
}

export const isRenderer = () => {
  // Renderer process
  // @ts-ignore
  if (typeof window !== 'undefined' && typeof window.process === 'object' && window.process.type === 'renderer') {
    return true
  }
  return false
}

export const isElectron = () => {
  // Renderer process
  if (isRenderer()) {
    return true
  }
  // Main process
  // @ts-ignore Property 'electron' does not exist on type 'ProcessVersions'
  if (isMain()) {
    return true
  }
  // Detect the user agent when the `nodeIntegration` option is set to true
  if (typeof navigator === 'object' && typeof navigator.userAgent === 'string' && navigator.userAgent.indexOf('Electron') >= 0) {
    return true
  }
  return false
}

// TODO example needed for failures
// url.parse was not working reliably so we just use this
// hack
const removeQuery = (_url: string) => {
  let qParamsIndex = _url.indexOf('?')
  if (qParamsIndex > -1) {
    return _url.substring(0, qParamsIndex)
  }
  return _url
}

export const parseArgsFromUrl = (requestUrl: string) => {
  const url_parts = url.parse(requestUrl, true)
  let { protocol, hostname, pathname, query } = url_parts

  // uri.pathname would be the preferred way
  // but caused issues when the protocol scheme was set as standard
  let resourcePath = requestUrl.replace(protocol || 'package:', '')

  // remove all leading /
  while(resourcePath && resourcePath.startsWith('/')) {
    resourcePath = resourcePath.slice(1)
  }

  // extract version from query params
  const targetVersion: string = query && (typeof query.version === 'string') ? query.version : 'latest'
  resourcePath = removeQuery(resourcePath)

  let normalizedPathname = pathname
  if (pathname && pathname.startsWith('/')) {
    normalizedPathname = pathname.slice(1)
  }

  return {
    resourcePath,
    targetVersion,
    hostname,
    pathname,
    normalizedPathname
  }
}