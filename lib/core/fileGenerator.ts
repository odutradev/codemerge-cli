import { mkdirSync } from 'fs';
import { join, dirname } from 'path';

import { FileUtils } from '../utils/fileUtils';
import { FILE_TEMPLATES } from './fileTemplates';

export interface GenerateResult {
  success: boolean;
  filesCreated: number;
  errors: string[];
}

export class FileGenerator {
  private basePath: string;

  constructor(basePath: string) {
    this.basePath = basePath;
  }

  public generate(force: boolean = false): GenerateResult {
    const filesCreated: string[] = [];
    const errors: string[] = [];

    for (const [filePath, content] of Object.entries(FILE_TEMPLATES) as [string, string][]) {
      try {
        const fullPath = join(this.basePath, filePath);
        if (!force && FileUtils.exists(fullPath)) {
          errors.push('File already exists: ' + filePath);
          continue;
        }

        this.ensureDirectory(dirname(fullPath));
        FileUtils.write(fullPath, content);
        filesCreated.push(filePath);
      } catch (error) {
        errors.push('Failed to create ' + filePath + ': ' + (error instanceof Error ? error.message : 'Unknown error'));
      }
    }

    return {
      success: errors.length === 0,
      filesCreated: filesCreated.length,
      errors
    };
  }

  private ensureDirectory(dirPath: string): void {
    if (!FileUtils.exists(dirPath)) {
      mkdirSync(dirPath, { recursive: true });
    }
  }
}