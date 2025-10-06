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
      
      const projectName = this.getProjectName(resolvedPath);
      const outputPath = projectName ? `${projectName}-merged.txt` : 'merged-output.txt';
      
      this.createConfigFile(configPath, outputPath, projectName);
      this.updateGitignore(resolvedPath, outputPath);
      
      Logger.success('Configuration file created: codemerge.json');
      Logger.plain('Output file added to .gitignore: ' + outputPath);
      Logger.plain('');
      Logger.plain('Next steps:');
      Logger.plain('  1. Review codemerge.json settings');
      Logger.plain('  2. Run: codemerge use');
    } catch (error) {
      Logger.error(error instanceof Error ? error.message : 'Unexpected error occurred');
      process.exit(1);
    }
  }

  private getProjectName(basePath: string): string | null {
    const packagePath = join(basePath, 'package.json');
    if (!FileUtils.exists(packagePath)) return null;

    try {
      const pkg = FileUtils.readJson<{ name?: string }>(packagePath);
      if (!pkg.name) return null;
      
      return pkg.name.replace(/^@.*?\//, '').replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase();
    } catch {
      return null;
    }
  }

  private createConfigFile(configPath: string, outputPath: string, projectName: string | null): void {
    const config = {
      projectName,
      outputPath,
      port: 9876,
      useGitignore: true,
      ignorePatterns: [
        'node_modules/**',
        '.git/**',
        'dist/**',
        'build/**',
        '**/*.log',
        'package-lock.json',
        'codemerge.json',
        'merged-output.txt',
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

  private updateGitignore(basePath: string, outputFileName: string): void {
    const gitignorePath = join(basePath, '.gitignore');
    
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