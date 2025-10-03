import { Command } from 'commander';

import { CodeMerger } from '../core/codeMerger.js';
import { Config } from '../core/config.js';
import { FileWatcher } from '../core/fileWatcher.js';
import { Logger } from '../utils/logger.js';

import type { CommandOptions } from '../types/config.js';

export class UseCommand {
  public register(program: Command): void {
    program.command('use').description('Merge code files into a single output file').argument('[path]', 'Input path to scan', '.').option('-o, --output <path>', 'Output file path').option('-w, --watch', 'Watch for file changes').option('--ignore <patterns>', 'Additional ignore patterns (comma-separated)').option('--include <patterns>', 'Include patterns (comma-separated)').action(this.execute.bind(this));
  }

  private async execute(inputPath: string, options: CommandOptions): Promise<void> {
    try {
      Logger.info('Starting code merge...');
      
      const config = Config.load(inputPath);
      const mergeOptions = Config.merge(config, {
        inputPath,
        outputPath: options.output,
        watch: options.watch,
        ignorePatterns: options.ignore ? options.ignore.split(',') : undefined,
        includePatterns: options.include ? options.include.split(',') : undefined
      });
      
      const merger = new CodeMerger(mergeOptions);
      const result = await merger.execute();
      
      if (!result.success) {
        Logger.error('Merge failed:');
        result.errors.forEach(error => Logger.error('  ' + error));
        process.exit(1);
      }

      Logger.success('Merged ' + result.filesProcessed + ' files into ' + result.outputPath);

      if (mergeOptions.watch) {
        const watcher = new FileWatcher(mergeOptions, async () => {
          const result = await merger.execute();
          if (result.success) {
            Logger.success('Merged ' + result.filesProcessed + ' files into ' + result.outputPath);
          }
        });
        watcher.start();

        process.on('SIGINT', () => {
          Logger.plain('\nStopping watcher...');
          watcher.stop();
          process.exit(0);
        });

        Logger.plain('Press Ctrl+C to stop watching');
      }
    } catch (error) {
      Logger.error(error instanceof Error ? error.message : 'Unexpected error occurred');
      process.exit(1);
    }
  }
}