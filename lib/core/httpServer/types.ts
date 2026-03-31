import { IncomingMessage, ServerResponse } from 'http'

import { CommandService } from './services/command.js'
import { CodeMerger } from '../codeMerger.js'
import { MergeCache } from '../mergeCache.js'

import type { MergeOptions } from '../../types/merge.js'

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