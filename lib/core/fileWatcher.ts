import { resolve } from 'path';
import chokidar from 'chokidar';

import { Logger } from '../utils/logger.js';
import { PatternUtils } from '../utils/patternUtils.js';

import type { MergeOptions } from '../types/merge.js';

export class FileWatcher {
  private watcher: chokidar.FSWatcher | null = null;
  private options: MergeOptions;
  private onChange: () => Promise<void>;
  private debounceTimer: NodeJS.Timeout | null = null;
  private changedFiles: Set<string> = new Set();

  constructor(options: MergeOptions, onChange: () => Promise<void>) {
    this.options = options;
    this.onChange = onChange;
  }

  public start(): void {
    if (this.watcher) this.stop();

    const outputPath = resolve(this.options.outputPath);
    const ignorePatterns = PatternUtils.addDefaultPatterns(
      this.options.ignorePatterns,
      this.options.outputPath
    );

    this.watcher = chokidar.watch(this.options.inputPath, {
      ignored: ignorePatterns,
      persistent: true,
      ignoreInitial: true,
      followSymlinks: false,
      ignorePermissionErrors: true
    });

    this.watcher.on('change', this.handleFileChange.bind(this));
    this.watcher.on('add', this.handleFileChange.bind(this));
    this.watcher.on('unlink', this.handleFileChange.bind(this));

    Logger.info('File watcher started');
  }

  public stop(): void {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    this.changedFiles.clear();
  }

  private handleFileChange(path: string): void {
    const outputPath = resolve(this.options.outputPath);
    const fullPath = resolve(path);
    
    if (fullPath === outputPath) return;

    this.changedFiles.add(path);
    
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    
    this.debounceTimer = setTimeout(async () => {
      const files = Array.from(this.changedFiles);
      this.changedFiles.clear();

      Logger.info(`Files changed (${files.length}):`);
      files.forEach(file => Logger.plain(`  ${file}`));
      
      try {
        await this.onChange();
      } catch (error) {
        Logger.error('Error during file change handling: ' + (error instanceof Error ? error.message : 'Unknown error'));
      }
    }, this.options.watchDelay);
  }
}