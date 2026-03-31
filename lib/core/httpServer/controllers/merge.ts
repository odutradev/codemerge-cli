import { Logger } from '@utils/logger.js'

import type { SelectiveContentRequest } from '@type/merge.js'
import type { RequestContext } from '../types.js'

export const handleMerge = ({ res, cache }: RequestContext): void => {
  const content = cache.get()

  if (!content) {
    res.writeHead(503, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Merge not ready yet' }))
    return
  }

  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' })
  res.end(content)
}

export const handleStructure = async ({ res, merger }: RequestContext): Promise<void> => {
  if (!merger) {
    res.writeHead(503, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Merger not initialized' }))
    return
  }

  try {
    const structure = await merger.getProjectStructure()
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(structure))
  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to generate structure' }))
  }
}

export const handleSelectiveContent = ({ req, res, merger }: RequestContext): void => {
  let body = ''
  req.on('data', chunk => body += chunk.toString())
  req.on('end', async () => {
    try {
      if (!merger) {
        res.writeHead(503, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'Merger not initialized' }))
        return
      }

      const data = JSON.parse(body) as SelectiveContentRequest

      if (!data.selectedPaths || !Array.isArray(data.selectedPaths)) {
        res.writeHead(400, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'selectedPaths array is required' }))
        return
      }

      const result = await merger.getSelectiveContent(data.selectedPaths)

      if (!result.success) {
        res.writeHead(500, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'Failed to generate content', details: result.errors }))
        return
      }

      res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' })
      res.end(result.content)
      Logger.success(`Generated selective content with ${result.filesProcessed} files`)
    } catch (error) {
      res.writeHead(400, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: error instanceof Error ? error.message : 'Invalid request' }))
    }
  })
  req.on('error', error => {
    res.writeHead(500, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: error.message }))
  })
}
