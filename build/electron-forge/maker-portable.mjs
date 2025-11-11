import { MakerBase } from '@electron-forge/maker-base'
import { build } from 'app-builder-lib'
import { resolve } from 'path'

// See: https://github.com/rabbit-hole-syndrome/electron-forge-maker-portable
export default class PortableMaker extends MakerBase {
  name = 'portable'
  defaultPlatforms = ['win32']

  isSupportedOnCurrentPlatform () {
    return process.platform === 'win32'
  }

  async make (options) {
    return build({
      prepackaged: options.dir,
      win: [`portable:${options.targetArch}`],
      config: {
        ...this.config,
        // eslint-disable-next-line no-template-curly-in-string
        artifactName: '${productName}-${platform}-${arch}-${version}.${ext}',
        directories: {
          output: resolve(options.dir, '..', 'make'),
          ...this.config?.directories
        }
      }
    })
  }
}
