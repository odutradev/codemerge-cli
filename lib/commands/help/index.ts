import { Command } from 'commander'

import Logger from '@utils/logger.js'
import File from '@utils/file.js'
import Path from '@utils/path.js'

import type { PackageInfo } from './types.js'

export default class HelpCommand {
  public register = (program: Command): void => {
    program
      .command('help')
      .description('Display help information')
      .argument('[command]', 'Command to get help for')
      .action((command?: string) => this.execute(program, command))
  }

  private execute = async (program: Command, command?: string): Promise<void> => {
    try {
      this.displayBanner()
      this.displayHelp(program, command)
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

  private displayHelp = (program: Command, command?: string): void => {
    if (command) {
      this.displayCommandHelp(program, command)
      return
    }
    program.help()
  }

  private displayCommandHelp = (program: Command, commandName: string): void => {
    const cmd = program.commands.find(c => c.name() === commandName)
    if (cmd) {
      cmd.help()
      return
    }
    Logger.error(`Command '${commandName}' not found`)
    program.help()
  }

  private getPackageJson = (): PackageInfo => File.readJson<PackageInfo>(Path.getPackagePath(import.meta.url, 'package.json'))
}