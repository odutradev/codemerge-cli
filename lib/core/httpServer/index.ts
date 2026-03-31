import { createServer, Server, IncomingMessage, ServerResponse } from 'http'

import { CommandService } from './services/command.js'
import { CodeMerger } from '@core/codeMerger.js'
import { MergeCache } from '@core/mergeCache.js'
import { Logger } from '@utils/logger.js'
import { routeRequest } from './router.js'

import type { RequestContext } from './types.js'
import type { MergeOptions } from '@type/merge.js'

export class HttpServer {
  private server: Server | null = null
  private commandService: CommandService
  private merger: CodeMerger | null = null
  private options: MergeOptions | null = null
  private port: number
  private projectName: string
  private cache: MergeCache
  private basePath: string

  constructor(port: number, projectName: string, cache: MergeCache, basePath: string = process.cwd()) {
    this.port = port
    this.projectName = projectName
    this.cache = cache
    this.basePath = basePath
    this.commandService = new CommandService()
  }

  public setMerger = (merger: CodeMerger, options: MergeOptions): void => {
    this.merger = merger
    this.options = options
  }

  public start = async (): Promise<void> => {
    return new Promise((resolveFn, rejectFn) => {
      this.server = createServer(this.handleRequest)
      this.server.on('error', (error: NodeJS.ErrnoException) => {
        if (error.code === 'EADDRINUSE') {
          Logger.error(`Port ${this.port} is already in use`)
          return rejectFn(error)
        }
        Logger.error(`Server error: ${error.message}`)
        rejectFn(error)
      })
      this.server.listen(this.port, () => resolveFn())
    })
  }

  public stop = (): void => {
    if (!this.server) return
    this.server.close()
    this.server = null
  }

  private handleRequest = (req: IncomingMessage, res: ServerResponse): void => {
    const context: RequestContext = {
      req,
      res,
      merger: this.merger,
      cache: this.cache,
      commandService: this.commandService,
      options: this.options,
      basePath: this.basePath,
      projectName: this.projectName
    }

    routeRequest(context)
  }
}
