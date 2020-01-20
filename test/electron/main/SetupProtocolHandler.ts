console.log('app ready?', require('electron').app.isReady())
import { registerPackageProtocol } from '../../../src/strategies/electron/CustomProtocol'
registerPackageProtocol()