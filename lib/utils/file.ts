import { readFileSync, writeFileSync, existsSync, mkdirSync, unlinkSync, readdirSync, rmdirSync } from 'fs'
import { dirname } from 'path'

export default class File {
  private static readonly BINARY_EXTENSIONS = [
    '.png', '.jpg', '.jpeg', '.gif', '.ico', '.bmp', '.svg',
    '.pdf', '.zip', '.tar', '.gz', '.rar', '.7z',
    '.exe', '.dll', '.so', '.dylib',
    '.mp3', '.mp4', '.avi', '.mov', '.wmv',
    '.ttf', '.woff', '.woff2', '.eot'
  ]

  public static read = (path: string): string => readFileSync(path, 'utf-8')

  public static write = (path: string, content: string): void => writeFileSync(path, content, 'utf-8')

  public static exists = (path: string): boolean => existsSync(path)

  public static isTextFile = (filePath: string): boolean => {
    const lowerPath = filePath.toLowerCase()
    return !this.BINARY_EXTENSIONS.some(ext => lowerPath.endsWith(ext))
  }

  public static readJson = <T>(path: string): T => JSON.parse(this.read(path)) as T

  public static upsert = (path: string, content: string): 'created' | 'updated' => {
    const exists = this.exists(path)
    const dir = dirname(path)
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
    this.write(path, content)
    return exists ? 'updated' : 'created'
  }

  public static ensureDir = (path: string): void => {
    if (!existsSync(path)) mkdirSync(path, { recursive: true })
  }

  public static deleteFile = (path: string): boolean => {
    if (!this.exists(path)) return false
    unlinkSync(path)
    return true
  }

  public static deleteEmptyDirs = (dirPath: string, basePath: string): void => {
    try {
      if (!existsSync(dirPath) || !dirPath.startsWith(basePath) || dirPath === basePath) return
      const files = readdirSync(dirPath)
      if (files.length === 0) {
        rmdirSync(dirPath)
        this.deleteEmptyDirs(dirname(dirPath), basePath)
      }
    } catch {
      return
    }
  }
}