import { Command } from 'commander';
import { basename, resolve } from 'path';

import { HttpServer } from '../core/httpServer.js';
import { CodeMerger } from '../core/codeMerger.js';
import { Config } from '../core/config.js';
import { MergeCache } from '../core/mergeCache.js';
import { FileWatcher } from '../core/fileWatcher.js';
import { Logger } from '../utils/logger.js';

import type { CommandOptions } from '../types/config.js';

export class WatchCommand {
  public register(program: Command): void {
    program.command('watch').description('Start HTTP server and watch for file changes').argument('[path]', 'Input path to scan', '.').option('-o, --output <path>', 'Output file path').option('-p, --port <number>', 'Server port', '9876').option('--ignore <patterns>', 'Additional ignore patterns (comma-separated)').option('--include <patterns>', 'Include patterns (comma-separated)').action(this.execute.bind(this));
  }

  private async execute(inputPath: string, options: CommandOptions & { port?: string }): Promise<void> {
    try {
      Logger.info('Starting watch mode...');
      
      const config = Config.load(inputPath);
      const mergeOptions = Config.merge(config, {
        inputPath,
        outputPath: options.output,
        watch: true,
        ignorePatterns: options.ignore ? options.ignore.split(',') : undefined,
        includePatterns: options.include ? options.include.split(',') : undefined
      });
      
      const projectName = this.getProjectName(mergeOptions.outputPath);
      const port = parseInt(options.port || '9876', 10);
      const cache = new MergeCache();
      const basePath = resolve(mergeOptions.inputPath);
      
      await this.performInitialMerge(mergeOptions, cache);
      
      const server = new HttpServer(port, projectName, cache, basePath);
      await server.start();
      
      const watcher = new FileWatcher(mergeOptions, async () => {
        await this.performInitialMerge(mergeOptions, cache);
      });
      watcher.start();
      
      this.setupGracefulShutdown(server, watcher);
      
      Logger.success(`Server running at http://localhost:${port}`);
      Logger.plain(`  Merge endpoint: http://localhost:${port}/${projectName}`);
      Logger.plain(`  Upsert endpoint: http://localhost:${port}/upsert`);
      Logger.plain(`  Health endpoint: http://localhost:${port}/health`);
      Logger.plain('Press Ctrl+C to stop');
    } catch (error) {
      Logger.error(error instanceof Error ? error.message : 'Unexpected error occurred');
      process.exit(1);
    }
  }

  private async performInitialMerge(options: any, cache: MergeCache): Promise<void> {
    const merger = new CodeMerger(options);
    const result = await merger.execute();
    
    if (!result.success) {
      Logger.error('Initial merge failed');
      result.errors.forEach(error => Logger.error('  ' + error));
      return;
    }
    
    const content = await this.readMergedContent(result.outputPath);
    cache.set(content);
    Logger.success(`Merged ${result.filesProcessed} files`);
  }

  private async readMergedContent(outputPath: string): Promise<string> {
    const { readFileSync } = await import('fs');
    return readFileSync(outputPath, 'utf-8');
  }

  private getProjectName(outputPath: string): string {
    const fileName = basename(outputPath);
    return fileName.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase();
  }

  private setupGracefulShutdown(server: HttpServer, watcher: FileWatcher): void {
    const shutdown = () => {
      Logger.plain('\nStopping server and watcher...');
      server.stop();
      watcher.stop();
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  }
}