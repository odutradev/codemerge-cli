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
    const ignorePatterns = options.ignorePatterns || config.ignorePatterns || this.DEFAULT_IGNORE_PATTERNS;
    
    if (!ignorePatterns.includes(outputPath)) {
      ignorePatterns.push(outputPath);
    }

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
}