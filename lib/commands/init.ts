import { Command } from 'commander';
import { readFileSync } from 'fs';
import { join } from 'path';

import { FileUtils } from '../utils/fileUtils.js';
import { PathUtils } from '../utils/pathUtils.js';
import { Logger } from '../utils/logger.js';

interface InitOptions {
  force?: boolean;
}

export class InitCommand {
  public register(program: Command): void {
    program.command('init').description('Initialize CodeMerge project structure').argument('[path]', 'Target directory', '.').option('-f, --force', 'Overwrite existing files').action(this.execute.bind(this));
  }

  private async execute(targetPath: string, options: InitOptions): Promise<void> {
    try {
      Logger.info('Initializing CodeMerge project...');
      
      const resolvedPath = PathUtils.resolve(targetPath);
      const configPath = join(resolvedPath, 'codemerge.json');
      
      if (!options.force && FileUtils.exists(configPath)) {
        Logger.error('codemerge.json already exists. Use --force to overwrite.');
        process.exit(1);
      }
      
      this.createConfigFile(configPath);
      this.updateGitignore(resolvedPath);
      
      Logger.success('Configuration file created: codemerge.json');
      Logger.plain('Output file added to .gitignore');
      Logger.plain('');
      Logger.plain('Next steps:');
      Logger.plain('  1. Review codemerge.json settings');
      Logger.plain('  2. Run: codemerge use');
    } catch (error) {
      Logger.error(error instanceof Error ? error.message : 'Unexpected error occurred');
      process.exit(1);
    }
  }

  private createConfigFile(configPath: string): void {
    const config = {
      outputPath: 'merged-output.txt',
      watch: false,
      ignorePatterns: [
        'node_modules/**',
        '.git/**',
        'dist/**',
        'build/**',
        '**/*.log',
        '.env*',
        '**/.DS_Store',
        'coverage/**',
        '.next/**',
        '.nuxt/**'
      ],
      includePatterns: [
        '**/*.ts',
        '**/*.js',
        '**/*.tsx',
        '**/*.jsx',
        '**/*.json',
        '**/*.md'
      ]
    };
    
    FileUtils.write(configPath, JSON.stringify(config, null, 2) + '\n');
  }

  private updateGitignore(basePath: string): void {
    const gitignorePath = join(basePath, '.gitignore');
    const outputFileName = 'merged-output.txt';
    
    if (!FileUtils.exists(gitignorePath)) {
      FileUtils.write(gitignorePath, outputFileName + '\n');
      return;
    }

    const content = readFileSync(gitignorePath, 'utf-8');
    const lines = content.split('\n');
    
    if (lines.some(line => line.trim() === outputFileName)) return;
    
    const newContent = content.endsWith('\n') ? content + outputFileName + '\n' : content + '\n' + outputFileName + '\n';
    FileUtils.write(gitignorePath, newContent);
  }
}