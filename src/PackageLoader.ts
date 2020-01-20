import url from 'url'
import crypto from 'crypto'
import ethpkg, { IPackage, PROCESS_STATES } from 'ethpkg'

export const md5 = (data : Buffer | string) => crypto.createHash('md5').update(data).digest("hex")

export const generateHostnameForRelease = async (pkg: IPackage) => {
  // FIXME use public key / address as origin
  // TODO construct stable uid independent of version number and release origin (e.g. github, cache)
  // construct mId based on package metadata not based on backend strategy
  // const pkg = await this.getLocalPackage(release)
  // const metadata = await pkg.getMetadata()
  // const { name } = metadata
  const { metadata } = pkg
  if (!metadata) {
    throw new Error('Package could not be loaded - metadata missing')
  }
  const { name } = metadata
  if (!name) {
    throw new Error('Package could not be loaded - metadata contains no valid name property')
  }
  // this should only be done for signed packages
  // name is the only property that stays fix however it is a very weak way
  // to generate the id since packages are not registered centrally
  const host = md5(name) // hash to eliminate special chars
  return `${host}.mod`
}

export interface IModule {
  pkg: IPackage, // the package
  appUrl: string, // the url that was resolved to the pkg
  t: number // timestamp when module was registered
}

export default class PackageLoader {
  
  private static modules: {[index: string]: IModule} = {};

  /**
   * A module is a downloaded and verified package that is kept in memory
   * and addressable via hostname
   * We can read files from the package with getResource
   */
  private async registerModule(pkg: IPackage, appUrl: string) : Promise<string> {
    const hostname = await generateHostnameForRelease(pkg)
    PackageLoader.modules[hostname] = { pkg, appUrl, t: Date.now() }
    return hostname
  }

  public getModule(hostname : string) : IModule | undefined {
    return PackageLoader.modules[hostname]
  }

  private getModuleByUrl(appUrl: string) : IModule | undefined {
    for(let mod of Object.values(PackageLoader.modules)) {
      if (mod.appUrl === appUrl) {
        return mod
      }
    }
    return undefined
  }

  public async loadApp(appUrl: string, options?: any) {
    let mod = this.getModuleByUrl(appUrl)

    let pkg
    if (mod) {
      pkg = mod.pkg
    } else {
      pkg = await ethpkg.getPackage(appUrl, {
        listener: (state, args) => {
          if (state === PROCESS_STATES.DOWNLOAD_PROGRESS) {
            const { progress, release } = args
            if (options && options.onProgress) {
              options.onProgress(progress, release)
            }
          }
        }
      })
    }

    if (!pkg) {
      throw new Error('package could not be fetched')
    }
    // FIXME support options
    const hostname = await this.registerModule(pkg, appUrl)
    const protocol = 'package:'
    const packageUrl = url.format({
      slashes: true,
      protocol,
      pathname: `${hostname}/index.html`
    })
    return packageUrl
  }

  public async getResource(virtualHost: string, resourcePath: string) {
    const mod = this.getModule(virtualHost)
    if (!mod) {
      throw new Error('No package found for hostname:'+virtualHost)
    }
    const { pkg } = mod
    const content = await pkg.getContent(resourcePath)
    return content
  }
}