import { Command } from 'commander'

import { Logger } from '../../utils/logger.js'
import { Path } from '../../utils/path.js'
import { File } from '../../utils/file.js'

import type { PackageInfo } from './types.js'

export class VersionCommand {
  public register = (program: Command): void => {
    program.command('version').description('Display version information').action(this.execute)
  }

  private execute = async (): Promise<void> => {
    try {
      this.displayBanner()
      this.displayVersion()
    } catch (error) {
      Logger.error(error instanceof Error ? error.message : 'Unexpected error occurred')
      process.exit(1)
    }
  }

  private displayBanner = (): void => {
    const packageJson = this.getPackageJson()
    const name = packageJson.name.replace('-', ' ').toUpperCase()
    Logger.banner(name)
  }

  private displayVersion = (): void => Logger.info(`Version: ${this.getPackageJson().version}`)

  private getPackageJson = (): PackageInfo => File.readJson<PackageInfo>(Path.getPackagePath(import.meta.url, 'package.json'))
}
