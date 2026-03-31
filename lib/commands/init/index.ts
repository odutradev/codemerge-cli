import { readFileSync } from 'fs'
import { Command } from 'commander'
import { join } from 'path'

import { DEFAULT_CONFIG } from '@core/defaults.js'
import { Logger } from '@utils/logger.js'
import { Path } from '@utils/path.js'
import { File } from '@utils/file.js'

import type { ConfigFile } from '@type/config.js'
import type { InitOptions } from './types.js'

export class InitCommand {
  public register = (program: Command): void => {
    program
      .command('init')
      .description('Initialize CodeMerge project structure')
      .argument('[path]', 'Target directory', '.')
      .option('-f, --force', 'Overwrite existing files')
      .action(this.execute)
  }

  private execute = async (targetPath: string, options: InitOptions): Promise<void> => {
    try {
      Logger.info('Initializing CodeMerge project...')
      const resolvedPath = Path.resolve(targetPath)
      const configPath = join(resolvedPath, 'codemerge.json')

      if (!options.force && File.exists(configPath)) {
        Logger.error('codemerge.json already exists. Use --force to overwrite.')
        process.exit(1)
      }

      const projectName = this.getProjectName(resolvedPath)
      const outputPath = projectName ? `${projectName}-merged.txt` : 'merged-output.txt'

      this.createConfigFile(configPath, outputPath, projectName)
      this.updateGitignore(resolvedPath, outputPath)

      Logger.success('Configuration file created: codemerge.json')
      Logger.plain(`Output file added to .gitignore: ${outputPath}`)
      Logger.plain('\nNext steps:\n  1. Review codemerge.json settings\n  2. Run: codemerge use')
    } catch (error) {
      Logger.error(error instanceof Error ? error.message : 'Unexpected error occurred')
      process.exit(1)
    }
  }

  private getProjectName = (basePath: string): string | null => {
    const packagePath = join(basePath, 'package.json')
    if (!File.exists(packagePath)) return null
    
    try {
      const pkg = File.readJson<{ name?: string }>(packagePath)
      if (!pkg.name) return null
      return pkg.name.replace(/^@.*?\//, '').replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase()
    } catch {
      return null
    }
  }

  private createConfigFile = (configPath: string, outputPath: string, projectName: string | null): void => {
    const config: ConfigFile = { projectName: projectName ?? 'codemerge-project', outputPath, ...DEFAULT_CONFIG }
    File.write(configPath, JSON.stringify(config, null, 2) + '\n')
  }

  private updateGitignore = (basePath: string, outputFileName: string): void => {
    const gitignorePath = join(basePath, '.gitignore')
    
    if (!File.exists(gitignorePath)) {
      File.write(gitignorePath, outputFileName + '\n')
      return
    }
    
    const content = readFileSync(gitignorePath, 'utf-8')
    if (content.split('\n').some(line => line.trim() === outputFileName)) return
    
    File.write(gitignorePath, content.endsWith('\n') ? `${content}${outputFileName}\n` : `${content}\n${outputFileName}\n`)
  }
}
