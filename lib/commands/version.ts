import { Command } from 'commander';

import { PathUtils } from '../utils/pathUtils.js';
import { FileUtils } from '../utils/fileUtils.js';
import { Logger } from '../utils/logger.js';

type PackageInfo = { name: string; version: string };

export class VersionCommand {
  public register(program: Command): void {
    program.command('version').description('Display version information').action(() => this.execute());
  }

  private async execute(): Promise<void> {
    try {
      this.displayBanner();
      this.displayVersion();
    } catch (error) {
      Logger.error(error instanceof Error ? error.message : 'Unexpected error occurred');
      process.exit(1);
    }
  }

  private displayBanner(): void {
    const packageJson = this.getPackageJson();
    const name = packageJson.name.replace('-', ' ').toUpperCase();
    Logger.banner(name);
  }

  private displayVersion(): void {
    const packageJson = this.getPackageJson();
    Logger.info(`Version: ${packageJson.version}`);
  }

  private getPackageJson(): PackageInfo {
    const packagePath = PathUtils.getPackagePath(import.meta.url, 'package.json');
    return FileUtils.readJson<PackageInfo>(packagePath);
  }
}