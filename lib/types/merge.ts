export interface MergeOptions {
  inputPath: string;
  outputPath: string;
  watch: boolean;
  watchDelay: number;
  ignorePatterns: string[];
  includePatterns: string[];
  useGitignore: boolean;
  port: number;
  writeOutput: boolean;
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
  content?: string;
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

export interface ProjectNode {
  name: string;
  type: 'file' | 'directory';
  path: string;
  lines?: number;
  children?: ProjectNode[];
}

export interface ProjectStructure {
  root: ProjectNode;
  totalFiles: number;
  totalDirectories: number;
  fileTypes: Record<string, number>;
}

export interface SelectiveContentRequest {
  selectedPaths: string[];
}
