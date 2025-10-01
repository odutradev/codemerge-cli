export interface MergeOptions {
  inputPath: string;
  outputPath: string;
  watch: boolean;
  ignorePatterns: string[];
  includePatterns: string[];
}

export interface ConfigFile {
  outputPath?: string;
  watch?: boolean;
  ignorePatterns?: string[];
  includePatterns?: string[];
}

export interface FileData {
  path: string;
  content: string;
  relativePath: string;
}

export interface MergeResult {
  success: boolean;
  outputPath: string;
  filesProcessed: number;
  errors: string[];
}

export interface CommandOptions {
  output?: string;
  watch?: boolean;
  ignore?: string;
  include?: string;
}