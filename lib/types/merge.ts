export interface MergeOptions {
  includePatterns: string[];
  ignorePatterns: string[];
  onUpsertCommand?: string;
  useGitignore: boolean;
  writeOutput: boolean;
  projectName?: string;
  watchDelay: number;
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
  filesProcessed: number;
  outputPath: string;
  success: boolean;
  errors: string[];
  content?: string;
}

export interface UpsertFile {
  content: string;
  path: string;
}

export interface UpsertRequest {
  files: UpsertFile[];
  basePath?: string;
}

export interface UpsertResult {
  filesProcessed: number;
  success: boolean;
  errors: string[];
  results: Array<{
    action: 'created' | 'updated';
    success: boolean;
    error?: string;
    path: string;
  }>;
}

export interface CommandOutput {
  timestamp: string;
  success: boolean;
  command: string;
  error?: string;
  output: string;
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

export interface DeleteFilesRequest {
  basePath?: string;
  files: string[];
}

export interface DeleteFilesResult {
  filesProcessed: number;
  success: boolean;
  errors: string[];
  results: Array<{
    success: boolean;
    error?: string;
    path: string;
  }>;
}

export interface CommitRequest {
  translate?: boolean;
  basePath?: string;
  message: string;
  type: string;
}

export interface CommitResult {
  success: boolean;
  output?: string;
  error?: string;
}