const format = (code: string, text: string) => `\x1b[${code}m${text}\x1b[0m`

const yellowBright = (t: string) => format('93', t)
const blueBright = (t: string) => format('94', t)
const redBright = (t: string) => format('91', t)
const cyanBold = (t: string) => format('1;36', t)
const yellow = (t: string) => format('33', t)
const green = (t: string) => format('32', t)
const cyan = (t: string) => format('36', t)
const red = (t: string) => format('31', t)

export class Logger {
  private static readonly PROJECT_PREFIX = blueBright('[project-log]')
  private static readonly PREFIX = redBright('[codemerge]')

  public static info(message: string): void {
    console.log(`${this.PREFIX} ${cyan('[info]')} ${message}`)
  }

  public static success(message: string): void {
    console.log(`${this.PREFIX} ${green('[success]')} ${message}`)
  }

  public static error(message: string): void {
    console.error(`${this.PREFIX} ${redBright('[error]')} ${red(message)}`)
  }

  public static warning(message: string): void {
    console.log(`${this.PREFIX} ${yellowBright('[warn]')} ${yellow(message)}`)
  }

  public static project(message: string): void {
    console.log(`${this.PROJECT_PREFIX} ${message}`)
  }

  public static projectError(message: string): void {
    console.log(`${this.PROJECT_PREFIX} ${red(message)}`)
  }

  public static plain(message: string): void {
    console.log(message)
  }

  public static banner(text: string): void {
    console.log(cyanBold(`\n--- ${text} ---\n`))
  }
}