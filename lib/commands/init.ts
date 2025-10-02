import { Command } from 'commander';

import { FileGenerator } from '../core/fileGenerator.js';
import { Logger } from '../utils/logger.js';
import { PathUtils } from '../utils/pathUtils.js';

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
      const generator = new FileGenerator(resolvedPath);
      const result = generator.generate(options.force || false);
     console.log(resolvedPath, result) 
      if (result.success) {
        Logger.success('Created ' + result.filesCreated + ' files successfully');
        Logger.plain('');
        Logger.plain('Next steps:');
        Logger.plain('  1. npm install');
        Logger.plain('  2. npm run build');
        Logger.plain('  3. npm start use');
      } else {
        Logger.warning('Created ' + result.filesCreated + ' files with ' + result.errors.length + ' errors:');
        result.errors.forEach(error => Logger.error('  ' + error));
        if (!options.force) {
          Logger.plain('');
          Logger.plain('Use --force to overwrite existing files');
        }
      }
    } catch (error) {
      Logger.error(error instanceof Error ? error.message : 'Unexpected error occurred');
      process.exit(1);
    }
  }
}