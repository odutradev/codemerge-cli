import { exec } from 'child_process'
import { promisify } from 'util'
import { resolve } from 'path'

import { translateText } from '@utils/translate.js'
import Logger from '@utils/logger.js'

import type { RequestContext } from '../types.js'
import type { CommitRequest } from '@type/merge.js'

const execAsync = promisify(exec)

export const handleCommit = ({ req, res, basePath }: RequestContext): void => {
  let body = ''
  req.on('data', chunk => body += chunk.toString())
  req.on('end', async () => {
    try {
      const data = JSON.parse(body) as CommitRequest

      if (!data.type || !data.message) {
        res.writeHead(400, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ success: false, error: 'Commit type and message are required' }))
        return
      }

      let commitMessage = data.message

      if (data.translate) {
        try {
          commitMessage = await translateText(commitMessage, 'en')
        } catch {
          Logger.warning('Translation failed, using original message')
        }
      }

      const targetPath = data.basePath ? resolve(data.basePath) : basePath
      const cleanType = data.type.replace(/"/g, '\\"')
      const cleanMessage = commitMessage.replace(/"/g, '\\"')
      const fullMessage = `${cleanType}: ${cleanMessage}`

      await execAsync('git add .', { cwd: targetPath })
      const { stdout, stderr } = await execAsync(`git commit -m "${fullMessage}"`, { cwd: targetPath })

      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ success: true, output: stdout.trim(), error: stderr ? stderr.trim() : undefined }))
      
      Logger.success(`Committed changes: ${fullMessage}`)
    } catch (error: unknown) {
      const err = error as { stdout?: string; message?: string }
      const isNoChanges = err.stdout?.includes('nothing to commit') || err.message?.includes('nothing to commit')
      
      res.writeHead(isNoChanges ? 200 : 500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ success: isNoChanges, output: err.stdout, error: isNoChanges ? 'No changes to commit' : err.message }))
      
      if (!isNoChanges) Logger.error(`Git commit failed: ${err.message}`)
    }
  })
}