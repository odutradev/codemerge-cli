import { Command } from 'commander';
import { FileUtils } from '../utils/fileUtils.js';
import { Logger } from '../utils/logger.js';
import type { CommandOptions } from '../types/config.js';

export class HelpCommand {
  public register(program: Command): void {
    program
      .command('help')
      .description('Display help information')
      .argument('[command]', 'Command to get help for')
      .action((command?: string) => this.execute(program, command));
  }

  private async execute(program: Command, command?: string): Promise<void> {
    try {
      this.displayBanner();
      this.displayHelp(program, command);
    } catch (error) {
      Logger.error(error instanceof Error ? error.message : 'Unexpected error occurred');
      process.exit(1);
    }
  }

  private displayBanner(): void {
    const packageJson = FileUtils.readJson('./package.json') as any;
    const name = packageJson.name.replace('-', ' ').toUpperCase();
    Logger.figlet(name);
  }

  private displayHelp(program: Command, command?: string): void {
    if (command) {
      this.displayCommandHelp(program, command);
      return;
    }
    
    program.help();
  }

  private displayCommandHelp(program: Command, commandName: string): void {
    const cmd = program.commands.find(c => c.name() === commandName);
    
    if (cmd) {
      cmd.help();
      return;
    }
    
    Logger.error(`Command '${commandName}' not found`);
    program.help();
  }
}