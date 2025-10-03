import chokidar from 'chokidar';

import { Logger } from '../utils/logger.js';

import type { MergeOptions } from '../types/merge.js';

export class FileWatcher {
  private watcher: chokidar.FSWatcher | null = null;
  private options: MergeOptions;
  private onChange: () => Promise<void>;
  private debounceTimer: NodeJS.Timeout | null = null;

  constructor(options: MergeOptions, onChange: () => Promise<void>) {
    this.options = options;
    this.onChange = onChange;
  }

  public start(): void {
    if (this.watcher) this.stop();

    this.watcher = chokidar.watch(this.options.inputPath, {
      ignored: this.options.ignorePatterns,
      persistent: true,
      ignoreInitial: true
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
  }

  private handleFileChange(path: string): void {
    Logger.info(`File changed: ${path}`);
    
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    
    this.debounceTimer = setTimeout(async () => {
      try {
        await this.onChange();
      } catch (error) {
        Logger.error('Error during file change handling: ' + (error instanceof Error ? error.message : 'Unknown error'));
      }
    }, 300);
  }
}