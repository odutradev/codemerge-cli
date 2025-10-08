import { join } from 'path';

import { FileUtils } from '../utils/fileUtils.js';
import { PathUtils } from '../utils/pathUtils.js';

import type { MergeOptions } from '../types/merge.js';
import type { ConfigFile } from '../types/config.js';

export class Config {
  private static readonly CONFIG_FILENAMES = [
    'codemerge.json',
    'codemerge.config.json'
  ];

  private static readonly DEFAULT_IGNORE_PATTERNS = [
    'node_modules',
    'node_modules/**',
    '**/node_modules',
    '**/node_modules/**',
    '.git',
    '.git/**',
    '**/.git',
    '**/.git/**',
    'dist',
    'dist/**',
    '**/dist',
    '**/dist/**',
    'build',
    'build/**',
    '**/build',
    '**/build/**',
    'coverage',
    'coverage/**',
    '**/coverage',
    '**/coverage/**',
    '.next',
    '.next/**',
    '**/.next',
    '**/.next/**',
    '.nuxt',
    '.nuxt/**',
    '**/.nuxt',
    '**/.nuxt/**',
    '**/*.log',
    '**/package-lock.json',
    '**/yarn.lock',
    '**/pnpm-lock.yaml',
    '**/.env',
    '**/.env.*',
    '**/.DS_Store',
    '**/Thumbs.db',
    '**/.vscode',
    '**/.idea',
    '**/codemerge.json',
    '**/codemerge.config.json',
    '**/merged-output.txt'
  ];

  private static readonly DEFAULT_INCLUDE_PATTERNS = [
    '**/*.ts',
    '**/*.js',
    '**/*.tsx',
    '**/*.jsx',
    '**/*.json',
    '**/*.md'
  ];

  private static readonly DEFAULT_PORT = 9876;

  public static load(basePath: string): ConfigFile {
    const resolvedPath = PathUtils.resolve(basePath);
    
    for (const filename of this.CONFIG_FILENAMES) {
      const configPath = join(resolvedPath, filename);
      if (FileUtils.exists(configPath)) {
        return this.parseConfigFile(configPath);
      }
    }
    
    return this.loadPackageJsonConfig(resolvedPath);
  }

  private static parseConfigFile(path: string): ConfigFile {
    try {
      return FileUtils.readJson<ConfigFile>(path);
    } catch {
      return {};
    }
  }

  private static loadPackageJsonConfig(basePath: string): ConfigFile {
    const packagePath = join(basePath, 'package.json');
    if (!FileUtils.exists(packagePath)) return {};

    try {
      const pkg = FileUtils.readJson<any>(packagePath);
      return pkg.codemergeConfig || {};
    } catch {
      return {};
    }
  }

  public static merge(config: ConfigFile, options: Partial<MergeOptions>): MergeOptions {
    const outputPath = options.outputPath || config.outputPath || 'merged-output.txt';
    const ignorePatterns = this.mergeIgnorePatterns(config.ignorePatterns, options.ignorePatterns, outputPath);

    return {
      inputPath: options.inputPath || process.cwd(),
      outputPath,
      watch: options.watch ?? false,
      watchDelay: 1500,
      ignorePatterns,
      includePatterns: options.includePatterns || config.includePatterns || this.DEFAULT_INCLUDE_PATTERNS,
      useGitignore: options.useGitignore ?? config.useGitignore ?? true,
      port: options.port ?? config.port ?? this.DEFAULT_PORT
    };
  }

  private static mergeIgnorePatterns(configPatterns?: string[], optionPatterns?: string[], outputPath?: string): string[] {
    const patterns = new Set([...this.DEFAULT_IGNORE_PATTERNS]);
    
    if (configPatterns) configPatterns.forEach(p => patterns.add(p));
    if (optionPatterns) optionPatterns.forEach(p => patterns.add(p));
    
    if (outputPath) {
      patterns.add(outputPath);
      patterns.add(`**/${outputPath}`);
    }

    return Array.from(patterns);
  }
}