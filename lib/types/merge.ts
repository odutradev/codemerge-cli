export interface MergeOptions {
  onUpsertCommand?: string;
  includePatterns: string[];
  ignorePatterns: string[];
  watchDelay: number;
  useGitignore: boolean;
  writeOutput: boolean;
  outputPath: string;
  inputPath: string;
  watch: boolean;
  port: number;
}

export interface FileData {
  relativePath: string;
  content: string;
  path: string;
}

export interface MergeResult {
  content?: string;
  filesProcessed: number;
  outputPath: string;
  errors: string[];
  success: boolean;
}

export interface UpsertFile {
  content: string;
  path: string;
}

export interface UpsertRequest {
  basePath?: string;
  files: UpsertFile[];
}

export interface UpsertResult {
  filesProcessed: number;
  errors: string[];
  success: boolean;
  results: Array<{
    action: 'created' | 'updated';
    success: boolean;
    error?: string;
    path: string;
  }>;
}

export interface CommandOutput {
  timestamp: string;
  command: string;
  output: string;
  error?: string;
  success: boolean;
}

export interface ProjectNode {
  type: 'file' | 'directory';
  children?: ProjectNode[];
  lines?: number;
  path: string;
  name: string;
}

export interface ProjectStructure {
  fileTypes: Record<string, number>;
  totalDirectories: number;
  totalFiles: number;
  root: ProjectNode;
}

export interface SelectiveContentRequest {
  selectedPaths: string[];
}