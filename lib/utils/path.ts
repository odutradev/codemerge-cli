import { resolve, relative, normalize, join, dirname } from 'path'
import { fileURLToPath } from 'url'

export class Path {
  public static resolve = (path: string): string => resolve(path)

  public static relative = (from: string, to: string): string => relative(from, to)

  public static normalize = (path: string): string => normalize(path)

  public static join = (...paths: string[]): string => join(...paths)

  public static isAbsolute = (path: string): boolean => resolve(path) === normalize(path)

  public static getPackageRoot = (importMetaUrl: string): string => {
    const __filename = fileURLToPath(importMetaUrl)
    const __dirname = dirname(__filename)
    return resolve(__dirname, '../..')
  }

  public static getPackagePath = (importMetaUrl: string, ...paths: string[]): string => join(this.getPackageRoot(importMetaUrl), ...paths)
}