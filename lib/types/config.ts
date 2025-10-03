export interface ConfigFile {
  outputPath?: string;
  watch?: boolean;
  watchDelay?: number;
  ignorePatterns?: string[];
  includePatterns?: string[];
  projectName?: string;
  useGitignore?: boolean;
}

export interface CommandOptions {
  output?: string;
  watch?: boolean;
  ignore?: string;
  include?: string;
  port?: string;
}