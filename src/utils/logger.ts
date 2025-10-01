import chalk from 'chalk';

export class Logger {
  public static info(message: string): void {
    console.log(chalk.cyan('ℹ'), message);
  }

  public static success(message: string): void {
    console.log(chalk.green('✅'), message);
  }

  public static error(message: string): void {
    console.error(chalk.red('❌'), message);
  }

  public static warning(message: string): void {
    console.log(chalk.yellow('⚠️'), message);
  }

  public static plain(message: string): void {
    console.log(message);
  }
}