import { resolve, relative, normalize, join } from 'path';

export class PathUtils {
  public static resolve(path: string): string {
    return resolve(path);
  }

  public static relative(from: string, to: string): string {
    return relative(from, to);
  }

  public static normalize(path: string): string {
    return normalize(path);
  }

  public static join(...paths: string[]): string {
    return join(...paths);
  }

  public static isAbsolute(path: string): boolean {
    return resolve(path) === normalize(path);
  }
}