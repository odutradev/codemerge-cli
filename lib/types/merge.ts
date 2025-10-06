export interface MergeOptions {
  inputPath: string;
  outputPath: string;
  watch: boolean;
  watchDelay: number;
  ignorePatterns: string[];
  includePatterns: string[];
  useGitignore: boolean;
  port: number;
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

export interface UpsertFile {
  path: string;
  content: string;
}

export interface UpsertRequest {
  files: UpsertFile[];
  basePath?: string;
}

export interface UpsertResult {
  success: boolean;
  filesProcessed: number;
  errors: string[];
  results: Array<{
    path: string;
    action: 'created' | 'updated';
    success: boolean;
    error?: string;
  }>;
}