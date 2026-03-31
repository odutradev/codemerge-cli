#!/usr/bin/env node

import { fileURLToPath, pathToFileURL } from 'url'
import { readFileSync, readdirSync } from 'fs'
import { dirname, join } from 'path'
import { Command } from 'commander'

import { Logger } from './utils/logger.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

interface CommandClass {
  new (): { register: (program: Command) => void }
}

class CLI {
  private program: Command

  constructor() {
    this.program = new Command()
    this.setupProgram()
  }

  private setupProgram = (): void => {
    const packagePath = join(__dirname, '../package.json')
    const packageJson = JSON.parse(readFileSync(packagePath, 'utf-8'))
    this.program.name('codemerge').description(packageJson.description).version(packageJson.version)
  }

  private registerCommands = async (): Promise<void> => {
    const commandsPath = join(__dirname, 'commands')
    const entries = readdirSync(commandsPath, { withFileTypes: true })

    for (const entry of entries) {
      if (entry.isDirectory()) await this.registerCommand(commandsPath, `${entry.name}/index.js`)
    }
  }

  private registerCommand = async (commandsPath: string, fileName: string): Promise<void> => {
    try {
      const filePath = join(commandsPath, fileName)
      const fileUrl = pathToFileURL(filePath).href
      const module = await import(fileUrl)
      const CommandClass = module[Object.keys(module).find(key => key.includes('Command')) || ''] as CommandClass

      if (!CommandClass) {
        Logger.warning(`Skipping ${fileName}: No command class found`)
        return
      }

      const commandInstance = new CommandClass()

      if (typeof commandInstance.register !== 'function') {
        Logger.warning(`Skipping ${fileName}: Missing register method`)
        return
      }

      commandInstance.register(this.program)
    } catch (error) {
      Logger.error(`Failed to load ${fileName}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  public run = async (): Promise<void> => {
    await this.registerCommands()
    this.program.parse(process.argv)
  }
}

;(async () => {
  const cli = new CLI()
  await cli.run()
})()