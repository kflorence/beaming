// noinspection JSUnresolvedReference
import { FusesPlugin } from '@electron-forge/plugin-fuses'
import { FuseV1Options, FuseVersion } from '@electron/fuses'

// noinspection JSUnusedGlobalSymbols
export default {
  packagerConfig: {
    asar: {
      unpack: '{**/steamworks_sdk/**,**/steamworks-ffi-node/**/*.node}'
    },
    icon: './src/images/icon',
    // See: https://github.com/electron/universal/issues/36
    osxNotarize: {
      appleId: process.env.APPLE_ID,
      appleIdPassword: process.env.APPLE_APP_PASSWORD,
      teamId: process.env.APPLE_TEAM_ID
    },
    osxSign: {
      optionsForFile: () => ({ entitlements: './build/entitlements.mac.plist' })
    },
    // See: https://electron.github.io/packager/main/interfaces/OsxUniversalOptions.html
    osxUniversal: {
      mergeASARs: true,
      x64ArchFiles: 'Contents/Resources/app.asar.unpacked/node_modules/**/*.node'
    }
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-deb',
      config: {
        options: {
          icon: './src/images/icon.png'
        }
      }
    },
    {
      name: 'build/electron-forge/maker-portable.js',
      config: {
        icon: './src/images/icon.ico'
      }
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin']
    }
  ],
  plugins: [
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true
    })
  ]
}
