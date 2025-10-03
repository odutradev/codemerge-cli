import { resolve, relative } from 'path';
import { glob } from 'glob';

import { FileUtils } from '../utils/fileUtils.js'; 

import type { MergeOptions, MergeResult, FileData } from '../types/merge.js';

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
    const totalLines = files.reduce((sum, file) => sum + file.content.split('\n').length, 0);
    const totalChars = files.reduce((sum, file) => sum + file.content.length, 0);
    const breakdown = this.generateBreakdown(files);
    const structure = this.generateStructure(files);
    const header = this.generateHeader(files.length, totalLines, totalChars, breakdown, structure);
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

  private generateHeader(fileCount: number, totalLines: number, totalChars: number, breakdown: string, structure: string): string {
    const timestamp = new Date().toISOString();
    return [
      '# Code Merge Output',
      'Generated at: ' + timestamp,
      'Source path: ' + this.options.inputPath,
      'Files processed: ' + fileCount,
      'Total lines: ' + totalLines,
      'Total characters: ' + totalChars,
      '',
      breakdown,
      '',
      structure
    ].join('\n');
  }

  private generateBreakdown(files: FileData[]): string {
    const typeMap = new Map<string, { count: number; lines: number }>();
    
    files.forEach(file => {
      const ext = file.relativePath.split('.').pop() || 'unknown';
      const lines = file.content.split('\n').length;
      const current = typeMap.get(ext) || { count: 0, lines: 0 };
      typeMap.set(ext, { count: current.count + 1, lines: current.lines + lines });
    });

    const sorted = Array.from(typeMap.entries()).sort((a, b) => b[1].count - a[1].count);
    const lines = sorted.map(([ext, data]) => `  - ${ext}: ${data.count} files (${data.lines.toLocaleString()} lines)`);
    
    return ['File types:', ...lines].join('\n');
  }

  private generateStructure(files: FileData[]): string {
    const tree: Record<string, FileData[]> = {};
    
    files.forEach(file => {
      const parts = file.relativePath.split(/[/\\]/);
      
      for (let i = 0; i < parts.length; i++) {
        const path = parts.slice(0, i + 1).join('/');
        const isFile = i === parts.length - 1;
        
        if (isFile) {
          const dir = i === 0 ? '.' : parts.slice(0, i).join('/');
          if (!tree[dir]) tree[dir] = [];
          tree[dir].push(file);
        }
      }
    });

    const sortedPaths = Object.keys(tree).sort();
    const lines = ['Project structure & file index:', './'];
    const processed = new Set<string>();

    sortedPaths.forEach(path => {
      const parts = path === '.' ? [] : path.split('/');
      const depth = parts.length;
      
      parts.forEach((part, index) => {
        const currentPath = parts.slice(0, index + 1).join('/');
        if (!processed.has(currentPath)) {
          const indent = '  '.repeat(index + 1);
          lines.push(`${indent}${part}/`);
          processed.add(currentPath);
        }
      });

      const dirFiles = tree[path].sort((a, b) => a.relativePath.localeCompare(b.relativePath));
      dirFiles.forEach(file => {
        const fileName = file.relativePath.split(/[/\\]/).pop()!;
        const lineCount = file.content.split('\n').length;
        const indent = '  '.repeat(depth + 1);
        lines.push(`${indent}- ${fileName} (${lineCount.toLocaleString()} lines)`);
      });
    });

    return lines.join('\n');
  }

  private writeOutput(content: string): void {
    FileUtils.write(this.options.outputPath, content);
  }
}