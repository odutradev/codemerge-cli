import { resolve, relative } from 'path';
import { glob } from 'glob';

import { FileUtils } from '../utils/fileUtils.js';
import { PathUtils } from '../utils/pathUtils.js';

import type { MergeOptions, MergeResult, FileData } from '../types';

export class CodeMerger {
  private options: MergeOptions;

  constructor(options: MergeOptions) {
    this.options = options;
  }

  public async execute(): Promise<MergeResult> {
    try {
      const files = await this.collectFiles();
      const content = this.mergeFiles(files);
      this.writeOutput(content);
      
      return {
        success: true,
        outputPath: this.options.outputPath,
        filesProcessed: files.length,
        errors: []
      };
    } catch (error) {
      return {
        success: false,
        outputPath: this.options.outputPath,
        filesProcessed: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  private async collectFiles(): Promise<FileData[]> {
    const files: FileData[] = [];
    const inputPath = resolve(this.options.inputPath);

    for (const pattern of this.options.includePatterns) {
      const matchedFiles = await glob(pattern, {
        cwd: inputPath,
        ignore: this.options.ignorePatterns,
        nodir: true
      });

      for (const file of matchedFiles) {
        const fullPath = resolve(inputPath, file);
        if (FileUtils.exists(fullPath) && FileUtils.isTextFile(fullPath)) {
          try {
            files.push({
              path: fullPath,
              content: FileUtils.read(fullPath),
              relativePath: relative(inputPath, fullPath)
            });
          } catch (error) {
            continue;
          }
        }
      }
    }

    return files.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
  }

  private mergeFiles(files: FileData[]): string {
    const header = this.generateHeader(files.length);
    const separator = '='.repeat(80);
    
    const mergedContent = files.map(file => {
      const fileSeparator = '-'.repeat(40);
      return [
        'STARTOFFILE: ' + file.relativePath,
        fileSeparator,
        file.content,
        fileSeparator,
        'ENDOFFILE: ' + file.relativePath,
        ''
      ].join('\n');
    }).join('\n');

    return [header, separator, '', mergedContent].join('\n');
  }

  private generateHeader(fileCount: number): string {
    const timestamp = new Date().toISOString();
    return [
      '# Code Merge Output',
      'Generated at: ' + timestamp,
      'Source path: ' + this.options.inputPath,
      'Files processed: ' + fileCount
    ].join('\n');
  }

  private writeOutput(content: string): void {
    FileUtils.write(this.options.outputPath, content);
  }
}