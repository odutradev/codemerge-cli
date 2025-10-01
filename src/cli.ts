#!/usr/bin/env node

import { Command } from 'commander';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

import { UseCommand } from './commands/use.js';
import { InitCommand } from './commands/init.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class CLI {
  private program: Command;

  constructor() {
    this.program = new Command();
    this.setupProgram();
    this.registerCommands();
  }

  private setupProgram(): void {
    const packagePath = join(__dirname, '../package.json');
    const packageJson = JSON.parse(readFileSync(packagePath, 'utf-8'));
    
    this.program.name('codemerge').description('AI-focused code and data preparation utility').version(packageJson.version);
  }

  private registerCommands(): void {
    const useCommand = new UseCommand();
    useCommand.register(this.program);

    const initCommand = new InitCommand();
    initCommand.register(this.program);
  }

  public run(): void {
    this.program.parse(process.argv);
  }
}

const cli = new CLI();
cli.run();