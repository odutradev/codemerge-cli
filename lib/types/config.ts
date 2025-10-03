export interface ConfigFile {
  outputPath?: string;
  watch?: boolean;
  ignorePatterns?: string[];
  includePatterns?: string[];
  projectName?: string;
}

export interface CommandOptions {
  output?: string;
  watch?: boolean;
  ignore?: string;
  include?: string;
  port?: string;
}