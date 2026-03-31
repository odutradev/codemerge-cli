import { resolve, dirname } from 'path'

import Logger from '@utils/logger.js'
import File from '@utils/file.js'

import type { UpsertRequest, UpsertResult, DeleteFilesRequest, DeleteFilesResult } from '@type/merge.js'
import type { RequestContext } from '../types.js'

const processUpsert = (data: UpsertRequest, basePath: string): UpsertResult => {
  if (!data.files || !Array.isArray(data.files)) {
    return { success: false, filesProcessed: 0, errors: ['Invalid request: files array is required'], results: [] }
  }

  const targetPath = data.basePath ? resolve(data.basePath) : basePath

  const results: UpsertResult['results'] = data.files.map(file => {
    if (!file.path || typeof file.content !== 'string') return { path: file.path || 'unknown', action: 'created', success: false, error: 'Invalid file entry' }
    
    const fullPath = resolve(targetPath, file.path)
    
    if (!fullPath.startsWith(targetPath)) return { path: file.path, action: 'created', success: false, error: 'Path outside base directory' }

    try {
      const action = File.upsert(fullPath, file.content)
      return { path: file.path, action, success: true }
    } catch (error) {
      return { path: file.path, action: 'created', success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  const successCount = results.filter(r => r.success).length
  const errors = results.filter(r => !r.success && r.error).map(r => `${r.path}: ${r.error!}`)

  return { success: successCount > 0, filesProcessed: successCount, errors, results }
}

const processDeleteFiles = (data: DeleteFilesRequest, basePath: string): DeleteFilesResult => {
  if (!data.files || !Array.isArray(data.files)) {
    return { success: false, filesProcessed: 0, errors: ['Invalid request: files array is required'], results: [] }
  }

  const targetPath = data.basePath ? resolve(data.basePath) : basePath

  const results: DeleteFilesResult['results'] = data.files.map(file => {
    if (!file || typeof file !== 'string') return { path: 'unknown', success: false, error: 'Invalid file path' }
    
    const fullPath = resolve(targetPath, file)
    
    if (!fullPath.startsWith(targetPath)) return { path: file, success: false, error: 'Path outside base directory' }

    try {
      const success = File.deleteFile(fullPath)
      if (success) File.deleteEmptyDirs(dirname(fullPath), targetPath)
      return { path: file, success, error: success ? undefined : 'File not found' }
    } catch (error) {
      return { path: file, success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  const successCount = results.filter(r => r.success).length
  const errors = results.filter(r => !r.success && r.error !== 'File not found').map(r => `${r.path}: ${r.error!}`)

  return { success: successCount > 0 || data.files.length === 0, filesProcessed: successCount, errors, results }
}

export const handleUpsert = ({ req, res, basePath, commandService, options }: RequestContext): void => {
  let body = ''
  req.on('data', chunk => body += chunk.toString())
  req.on('end', () => {
    try {
      const data = JSON.parse(body) as UpsertRequest
      const result = processUpsert(data, basePath)
      
      res.writeHead(result.success ? 200 : 400, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify(result))
      
      if (!result.success) return

      Logger.success(`Upserted ${result.filesProcessed} files`)
      result.results.forEach(r => r.success ? Logger.plain(`  ${r.action}: ${r.path}`) : Logger.error(`  failed: ${r.path} - ${r.error}`))
      
      commandService.execute(options?.onUpsertCommand)
    } catch (error) {
      res.writeHead(400, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Invalid request' }))
    }
  })
  req.on('error', error => {
    res.writeHead(500, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ success: false, error: error.message }))
  })
}

export const handleDeleteFiles = ({ req, res, basePath }: RequestContext): void => {
  let body = ''
  req.on('data', chunk => body += chunk.toString())
  req.on('end', () => {
    try {
      const data = JSON.parse(body) as DeleteFilesRequest
      const result = processDeleteFiles(data, basePath)
      
      res.writeHead(result.success ? 200 : 400, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify(result))
      
      if (!result.success) return

      Logger.success(`Deleted ${result.filesProcessed} files`)
      result.results.forEach(r => r.success ? Logger.plain(`  deleted: ${r.path}`) : Logger.error(`  failed: ${r.path} - ${r.error}`))
    } catch (error) {
      res.writeHead(400, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Invalid request' }))
    }
  })
  req.on('error', error => {
    res.writeHead(500, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ success: false, error: error.message }))
  })
}