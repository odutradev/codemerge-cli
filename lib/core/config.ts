import { join } from 'path'

import { DEFAULT_CONFIG, DEFAULT_IGNORE_PATTERNS, DEFAULT_INCLUDE_PATTERNS } from './defaults.js'
import Path from '@utils/path.js'
import File from '@utils/file.js'

import type { MergeOptions } from '@type/merge.js'
import type { ConfigFile } from '@type/config.js'

export default class Config {
  private static readonly CONFIG_FILENAMES = ['codemerge.json', 'codemerge.config.json']

  public static load = (basePath: string): ConfigFile => {
    const resolvedPath = Path.resolve(basePath)

    for (const filename of this.CONFIG_FILENAMES) {
      const configPath = join(resolvedPath, filename)
      if (File.exists(configPath)) return this.parseConfigFile(configPath)
    }

    return this.loadPackageJsonConfig(resolvedPath)
  }

  private static parseConfigFile = (path: string): ConfigFile => {
    try {
      return File.readJson<ConfigFile>(path)
    } catch {
      return {}
    }
  }

  private static loadPackageJsonConfig = (basePath: string): ConfigFile => {
    const packagePath = join(basePath, 'package.json')
    if (!File.exists(packagePath)) return {}

    try {
      const pkg = File.readJson<{ codemergeConfig?: ConfigFile }>(packagePath)
      return pkg.codemergeConfig ?? {}
    } catch {
      return {}
    }
  }

  public static merge = (config: ConfigFile, options: Partial<MergeOptions>): MergeOptions => {
    const outputPath = options.outputPath || config.outputPath || 'merged-output.txt'
    const ignorePatterns = this.mergeIgnorePatterns(config.ignorePatterns, options.ignorePatterns, outputPath)

    return {
      projectName: config.projectName,
      inputPath: options.inputPath || process.cwd(),
      outputPath,
      watch: options.watch ?? false,
      watchDelay: 1500,
      ignorePatterns,
      includePatterns: options.includePatterns || config.includePatterns || DEFAULT_INCLUDE_PATTERNS,
      useGitignore: options.useGitignore ?? config.useGitignore ?? DEFAULT_CONFIG.useGitignore ?? true,
      port: options.port ?? config.port ?? DEFAULT_CONFIG.port ?? 9876,
      writeOutput: options.writeOutput ?? true,
      onUpsertCommand: config.onUpsertCommand ?? DEFAULT_CONFIG.onUpsertCommand,
      onStartCommand: config.onStartCommand ?? DEFAULT_CONFIG.onStartCommand,
      onStartCommandLogs: config.onStartCommandLogs ?? DEFAULT_CONFIG.onStartCommandLogs ?? false
    }
  }

  private static mergeIgnorePatterns = (configPatterns?: string[], optionPatterns?: string[], outputPath?: string): string[] => {
    const patterns = new Set([...DEFAULT_IGNORE_PATTERNS])

    if (configPatterns) configPatterns.forEach(p => patterns.add(p))
    if (optionPatterns) optionPatterns.forEach(p => patterns.add(p))
    if (outputPath) {
      patterns.add(outputPath)
      patterns.add(`**/${outputPath}`)
    }

    return Array.from(patterns)
  }
}