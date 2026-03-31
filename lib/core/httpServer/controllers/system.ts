import { exec } from 'child_process'
import { promisify } from 'util'
import { resolve } from 'path'

import Logger from '@utils/logger.js'

import type { ExecuteCommandsRequest, ExecuteCommandsResult } from '@type/merge.js'
import type { RequestContext } from '../types.js'

const execAsync = promisify(exec)

export const handleHealth = ({ res, projectName, cache }: RequestContext): void => {
  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({
    status: 'ok',
    project: projectName,
    endpoints: {
      merge: '/content',
      structure: '/structure',
      selectiveContent: '/selective-content',
      upsert: '/upsert',
      deleteFiles: '/delete-files',
      commit: '/commit',
      executeCommands: '/execute-commands',
      commandOutput: '/command-output',
      health: '/health'
    },
    mergeReady: cache.get() !== null
  }))
}

export const handleNotFound = ({ res }: RequestContext): void => {
  res.writeHead(404, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({
    error: 'Not found',
    availableEndpoints: ['/', '/health', '/content', '/structure', '/selective-content', '/upsert', '/delete-files', '/commit', '/execute-commands', '/command-output']
  }))
}

export const handleCommandOutput = ({ res, commandService }: RequestContext): void => {
  commandService.getResultOrWait(result => {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(result))
  })
}

export const handleExecuteCommands = ({ req, res, basePath }: RequestContext): void => {
  let body = ''
  req.on('data', chunk => body += chunk.toString())
  req.on('end', async () => {
    try {
      const data = JSON.parse(body) as ExecuteCommandsRequest

      if (!data.commandsToExecute || !Array.isArray(data.commandsToExecute)) {
        res.writeHead(400, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ success: false, commandsProcessed: 0, errors: ['commandsToExecute array is required'], results: [] }))
        return
      }

      const targetPath = data.basePath ? resolve(data.basePath) : basePath
      const results: ExecuteCommandsResult['results'] = []
      const errors: string[] = []
      let successCount = 0

      for (const command of data.commandsToExecute) {
        if (!command || typeof command !== 'string') {
          results.push({ command: 'unknown', success: false, error: 'Invalid command format' })
          errors.push('unknown: Invalid command format')
          continue
        }

        try {
          const { stdout } = await execAsync(command, { cwd: targetPath })
          results.push({ command, success: true, output: stdout.trim() })
          successCount++
          Logger.success(`Command executed successfully: ${command}`)
        } catch (error: unknown) {
          const err = error as Error & { stdout?: string }
          const errorMsg = err.message || 'Unknown execution error'
          results.push({ command, success: false, error: errorMsg, output: err.stdout?.trim() })
          errors.push(`${command}: ${errorMsg}`)
          Logger.error(`Command failed: ${command} - ${errorMsg}`)
        }
      }

      const isSuccess = successCount > 0 || data.commandsToExecute.length === 0
      res.writeHead(isSuccess ? 200 : 400, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ success: isSuccess, commandsProcessed: successCount, errors, results }))
    } catch (error) {
      res.writeHead(400, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ success: false, commandsProcessed: 0, errors: [error instanceof Error ? error.message : 'Invalid request'], results: [] }))
    }
  })
  req.on('error', error => {
    res.writeHead(500, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ success: false, commandsProcessed: 0, errors: [error.message], results: [] }))
  })
}