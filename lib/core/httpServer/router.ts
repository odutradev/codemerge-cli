import { handleHealth, handleNotFound, handleCommandOutput, handleExecuteCommands } from './controllers/system.js'
import { handleMerge, handleStructure, handleSelectiveContent } from './controllers/merge.js'
import { handleUpsert, handleDeleteFiles } from './controllers/file.js'
import { handleCommit } from './controllers/git.js'

import type { RequestContext } from './types.js'

export default class Router {
  public static handle = (context: RequestContext): void => {
    const { req } = context
    const url = req.url || ''
    const method = req.method || 'GET'

    if (url === '/execute-commands' && method === 'POST') return handleExecuteCommands(context)
    if (url === '/upsert' && method === 'POST') return handleUpsert(context)
    if (url === '/delete-files' && method === 'POST') return handleDeleteFiles(context)
    if (url === '/commit' && method === 'POST') return handleCommit(context)
    if (url === '/selective-content' && method === 'POST') return handleSelectiveContent(context)
    if (url === '/content' || url === '/content/') return handleMerge(context)
    if (url === '/structure' || url === '/structure/') return void handleStructure(context)
    if (url === '/command-output' || url === '/command-output/') return handleCommandOutput(context)
    if (url === '/health' || url === '/') return handleHealth(context)

    handleNotFound(context)
  }
}