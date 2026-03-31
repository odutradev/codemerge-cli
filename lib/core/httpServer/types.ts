import { IncomingMessage, ServerResponse } from 'http'

import CommandService from './services/command.js'
import CodeMerger from '@core/codeMerger.js'
import MergeCache from '@core/mergeCache.js'

import type { MergeOptions } from '@type/merge.js'

export interface RequestContext {
  req: IncomingMessage
  res: ServerResponse
  merger: CodeMerger | null
  cache: MergeCache
  commandService: CommandService
  options: MergeOptions | null
  basePath: string
  projectName: string
}