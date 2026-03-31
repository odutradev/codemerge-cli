import { spawn } from 'child_process'

import Logger from './logger.js'

export default class Process {
  public static runCommand = (command: string, showLogs: boolean = false): void => {
    if (!command) return
    
    Logger.info(`Running start command: ${command}`)
    
    const [cmd, ...args] = command.split(' ')
    const child = spawn(cmd, args, { shell: true })
    
    if (showLogs) {
      child.stdout.on('data', data => data.toString().split('\n').filter(Boolean).forEach((line: string) => Logger.project(line)))
      child.stderr.on('data', data => data.toString().split('\n').filter(Boolean).forEach((line: string) => Logger.projectError(line)))
    }
    
    child.on('error', error => Logger.error(`Failed to start project command: ${error.message}`))
    child.on('exit', code => {
      if (code !== 0 && code !== null) Logger.warning(`Project command exited with code ${code}`)
    })
  }
}