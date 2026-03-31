import { exec } from 'child_process'

import Logger from '@utils/logger.js'

import type { CommandOutput } from '@type/merge.js'

export default class CommandService {
  private waiters: Array<(result: CommandOutput | { status: string }) => void> = []
  private result: CommandOutput | null = null
  private isExecuting: boolean = false

  public execute = (command?: string): void => {
    if (!command) return

    this.isExecuting = true
    Logger.info(`Executing upsert command: ${command}`)

    exec(command, (error, stdout, stderr) => {
      const output = stdout + (stderr ? `\nSTDERR:\n${stderr}` : '')
      const success = !error

      this.result = { timestamp: new Date().toISOString(), command, output: output.trim(), error: error?.message, success }
      this.isExecuting = false

      if (success) {
        Logger.success(`Command executed successfully`)
      } else {
        Logger.error(`Command execution failed: ${error?.message}`)
      }

      const finalResult = this.result || { status: 'no_command_executed' }
      this.waiters.forEach(resolve => resolve(finalResult))
      this.waiters = []
    })
  }

  public getResultOrWait = (callback: (result: CommandOutput | { status: string }) => void): void => {
    if (this.isExecuting) {
      this.waiters.push(callback)
      return
    }
    callback(this.result || { status: 'no_command_executed' })
  }
}