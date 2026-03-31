import { basename, resolve } from 'path'
import { Command } from 'commander'

import HttpServer from '@core/httpServer/index.js'
import FileWatcher from '@core/fileWatcher.js'
import CodeMerger from '@core/codeMerger.js'
import MergeCache from '@core/mergeCache.js'
import Process from '@utils/process.js'
import Config from '@core/config.js'
import Logger from '@utils/logger.js'

import type { WatchOptions } from './types.js'

export default class WatchCommand {
  public register = (program: Command): void => {
    program
      .command('watch')
      .description('Start HTTP server and watch for file changes')
      .argument('[path]', 'Input path to scan', '.')
      .option('-o, --output <path>', 'Output file path')
      .option('-p, --port <number>', 'Server port', '9876')
      .option('--ignore <patterns>', 'Additional ignore patterns (comma-separated)')
      .option('--include <patterns>', 'Include patterns (comma-separated)')
      .action(this.execute)
  }

  private execute = async (inputPath: string, options: WatchOptions): Promise<void> => {
    try {
      Logger.info('Starting watch mode...')
      
      const config = Config.load(inputPath)
      const mergeOptions = Config.merge(config, {
        inputPath,
        outputPath: options.output,
        watch: true,
        writeOutput: false,
        ignorePatterns: options.ignore ? options.ignore.split(',') : undefined,
        includePatterns: options.include ? options.include.split(',') : undefined
      })
      
      if (mergeOptions.onStartCommand) Process.runCommand(mergeOptions.onStartCommand, mergeOptions.onStartCommandLogs)
      
      const projectName = this.getProjectName(mergeOptions.outputPath)
      const port = parseInt(options.port || '9876', 10)
      const cache = new MergeCache()
      const basePath = resolve(mergeOptions.inputPath)
      const merger = new CodeMerger(mergeOptions)
      
      await this.performInitialMerge(merger, cache)
      
      const server = new HttpServer(port, projectName, cache, basePath)
      
      server.setMerger(merger, mergeOptions)
      await server.start()
      
      const watcher = new FileWatcher(mergeOptions, async () => await this.performInitialMerge(merger, cache))
      
      watcher.start()
      
      this.setupGracefulShutdown(server, watcher)
      
      Logger.success(`Server running at http://localhost:${port}`)
      Logger.plain(`  Merge endpoint: http://localhost:${port}/content`)
      Logger.plain(`  Structure endpoint: http://localhost:${port}/structure`)
      Logger.plain(`  Selective content: http://localhost:${port}/selective-content`)
      Logger.plain(`  Upsert endpoint: http://localhost:${port}/upsert`)
      Logger.plain(`  Delete files endpoint: http://localhost:${port}/delete-files`)
      Logger.plain(`  Commit endpoint: http://localhost:${port}/commit`)
      Logger.plain(`  Execute commands endpoint: http://localhost:${port}/execute-commands`)
      Logger.plain(`  Command output endpoint: http://localhost:${port}/command-output`)
      Logger.plain('Press Ctrl+C to stop')
    } catch (error) {
      Logger.error(error instanceof Error ? error.message : 'Unexpected error occurred')
      process.exit(1)
    }
  }

  private performInitialMerge = async (merger: CodeMerger, cache: MergeCache): Promise<void> => {
    const result = await merger.execute()
    
    if (!result.success) {
      Logger.error('Initial merge failed')
      result.errors.forEach(error => Logger.error(`  ${error}`))
      return
    }
    
    if (result.content) cache.set(result.content)
    Logger.success(`Merged ${result.filesProcessed} files`)
  }

  private getProjectName = (outputPath: string): string => basename(outputPath).replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase()

  private setupGracefulShutdown = (server: HttpServer, watcher: FileWatcher): void => {
    const shutdown = () => {
      Logger.plain('\nStopping server and watcher...')
      server.stop()
      watcher.stop()
      process.exit(0)
    }
    
    process.on('SIGINT', shutdown)
    process.on('SIGTERM', shutdown)
  }
}