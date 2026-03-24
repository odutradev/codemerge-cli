export interface ConfigFile {
  onStartCommandLogs?: boolean;
  onStartCommand?: string;
  onUpsertCommand?: string;
  includePatterns?: string[];
  ignorePatterns?: string[];
  useGitignore?: boolean;
  projectName?: string;
  outputPath?: string;
  port?: number;
}

export interface CommandOptions {
  include?: string;
  ignore?: string;
  output?: string;
  watch?: boolean;
  port?: string;
}