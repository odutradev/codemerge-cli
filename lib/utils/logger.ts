import figlet from 'figlet';
import chalk from 'chalk';

export class Logger {
  private static readonly PREFIX = chalk.redBright('[codemerge]');
  private static readonly PROJECT_PREFIX = chalk.blueBright('[project-log]');

  public static info(message: string): void {
    console.log(`${this.PREFIX} ${chalk.cyan('[info]')} ${message}`);
  }

  public static success(message: string): void {
    console.log(`${this.PREFIX} ${chalk.green('[success]')} ${message}`);
  }

  public static error(message: string): void {
    console.error(`${this.PREFIX} ${chalk.redBright('[error]')} ${chalk.red(message)}`);
  }

  public static warning(message: string): void {
    console.log(`${this.PREFIX} ${chalk.yellowBright('[warn]')} ${chalk.yellow(message)}`);
  }

  public static project(message: string): void {
    console.log(`${this.PROJECT_PREFIX} ${message}`);
  }

  public static plain(message: string): void {
    console.log(message);
  }

  public static figlet(text: string): void {
    console.log(chalk.cyan(figlet.textSync(text)));
  }

  public static table(head: string[], colWidths: number[], data: unknown[][]): void {
    const buildSep = (left: string, mid: string, right: string, char: string) => 
      left + colWidths.map(w => char.repeat(w + 2)).join(mid) + right;

    const buildRow = (row: unknown[]) => 
      '│ ' + row.map((cell, i) => String(cell).padEnd(colWidths[i] ?? 10)).join(' │ ') + ' │';

    console.log(buildSep('┌', '┬', '┐', '─'));
    console.log(buildRow(head));
    console.log(buildSep('├', '┼', '┤', '─'));
    
    data.forEach(item => console.log(buildRow(item)));
    
    console.log(buildSep('└', '┴', '┘', '─'));
  }
}