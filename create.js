#!/usr/bin/env node

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

const templates = {
  'package.json': JSON.stringify({
    name: "codemerge",
    version: "1.0.0",
    description: "AI-focused code and data preparation utility",
    license: "MIT",
    author: "CodeMerge Team",
    type: "module",
    main: "dist/index.js",
    bin: {
      codemerge: "bin/codemerge.js"
    },
    repository: {
      type: "git",
      url: "https://github.com/yourusername/codemerge.git"
    },
    keywords: ["ai", "code", "merge", "preparation", "cli", "developer-tools"],
    scripts: {
      build: "tsc",
      dev: "tsx watch src/cli.ts",
      start: "node dist/cli.js",
      prepublishOnly: "npm run build"
    },
    dependencies: {
      chalk: "^5.4.1",
      chokidar: "^3.6.0",
      commander: "^11.1.0",
      glob: "^10.3.10"
    },
    devDependencies: {
      "@types/node": "^20.10.0",
      tsx: "^4.7.0",
      typescript: "^5.3.3"
    },
    engines: {
      node: ">=16.0.0"
    },
    files: ["dist/**/*", "bin/**/*"]
  }, null, 2),

  'tsconfig.json': JSON.stringify({
    compilerOptions: {
      target: "ES2020",
      module: "ES2020",
      lib: ["ES2020"],
      outDir: "./dist",
      rootDir: "./src",
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
      forceConsistentCasingInFileNames: true,
      moduleResolution: "node",
      resolveJsonModule: true,
      declaration: true,
      declarationMap: true,
      sourceMap: true,
      removeComments: true
    },
    include: ["src/**/*"],
    exclude: ["node_modules", "dist"]
  }, null, 2),

  '.gitignore': `node_modules/
dist/
*.log
.env
.DS_Store
coverage/
*.tsbuildinfo
merged-output.txt`,

  'codemerge.json': JSON.stringify({
    outputPath: "ai-digest.txt",
    watch: false,
    ignorePatterns: [
      "node_modules/**",
      ".git/**",
      "dist/**",
      "build/**",
      "**/*.log",
      ".env*"
    ],
    includePatterns: [
      "**/*.ts",
      "**/*.js",
      "**/*.tsx",
      "**/*.jsx",
      "**/*.json",
      "**/*.md"
    ]
  }, null, 2),

  'README.md': `# CodeMerge

AI-focused code and data preparation utility.

## Bootstrap (Create New Project)

To create a new CodeMerge project from scratch:

\`\`\`bash
# Using bootstrap script
node bootstrap.js [target-directory] [--force]

# Examples
node bootstrap.js
node bootstrap.js ./my-project
node bootstrap.js . --force
\`\`\`

## Installation

\`\`\`bash
npm install -g codemerge
\`\`\`

## Quick Start

\`\`\`bash
# Merge current directory
codemerge use

# Merge specific directory
codemerge use ./src

# Custom output
codemerge use --output ai-digest.txt

# With filters
codemerge use --ignore "*.log,*.test.ts"
codemerge use --include "**/*.ts,**/*.js"
\`\`\`

## Configuration

Create \`codemerge.json\` in your project root:

\`\`\`json
{
  "outputPath": "ai-digest.txt",
  "ignorePatterns": ["node_modules/**", "dist/**"],
  "includePatterns": ["**/*.ts", "**/*.js"]
}
\`\`\`

## Development

\`\`\`bash
# Install dependencies
npm install

# Build
npm run build

# Development mode
npm run dev

# Run locally
npm start use
\`\`\`

## License

MIT`,

  'bin/codemerge.js': `#!/usr/bin/env node

import '../dist/cli.js';`,

  'src/types.ts': `export interface MergeOptions {
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
}`,

  'src/utils/logger.ts': `import chalk from 'chalk';

export class Logger {
  public static info(message: string): void {
    console.log(chalk.cyan('ℹ'), message);
  }

  public static success(message: string): void {
    console.log(chalk.green('✅'), message);
  }

  public static error(message: string): void {
    console.error(chalk.red('❌'), message);
  }

  public static warning(message: string): void {
    console.log(chalk.yellow('⚠️'), message);
  }

  public static plain(message: string): void {
    console.log(message);
  }
}`,

  'src/utils/pathUtils.ts': `import { resolve, relative, normalize, join } from 'path';

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
}`,

  'src/utils/fileUtils.ts': `import { readFileSync, writeFileSync, existsSync } from 'fs';

export class FileUtils {
  private static readonly BINARY_EXTENSIONS = [
    '.png', '.jpg', '.jpeg', '.gif', '.ico', '.bmp', '.svg',
    '.pdf', '.zip', '.tar', '.gz', '.rar', '.7z',
    '.exe', '.dll', '.so', '.dylib',
    '.mp3', '.mp4', '.avi', '.mov', '.wmv',
    '.ttf', '.woff', '.woff2', '.eot'
  ];

  public static read(path: string): string {
    return readFileSync(path, 'utf-8');
  }

  public static write(path: string, content: string): void {
    writeFileSync(path, content, 'utf-8');
  }

  public static exists(path: string): boolean {
    return existsSync(path);
  }

  public static isTextFile(filePath: string): boolean {
    const lowerPath = filePath.toLowerCase();
    return !this.BINARY_EXTENSIONS.some(ext => lowerPath.endsWith(ext));
  }

  public static readJson<T>(path: string): T {
    const content = this.read(path);
    return JSON.parse(content) as T;
  }
}`,

  'src/core/config.ts': `import { join } from 'path';

import { FileUtils } from '../utils/fileUtils.js';
import { PathUtils } from '../utils/pathUtils.js';

import type { ConfigFile, MergeOptions } from '../types';

export class Config {
  private static readonly CONFIG_FILENAMES = [
    'codemerge.json',
    'codemerge.config.json'
  ];

  private static readonly DEFAULT_IGNORE_PATTERNS = [
    'node_modules/**',
    '.git/**',
    'dist/**',
    'build/**',
    '**/*.log',
    '.env*',
    '**/.DS_Store',
    'coverage/**',
    '.next/**',
    '.nuxt/**'
  ];

  private static readonly DEFAULT_INCLUDE_PATTERNS = [
    '**/*.ts',
    '**/*.js',
    '**/*.tsx',
    '**/*.jsx',
    '**/*.json',
    '**/*.md'
  ];

  public static load(basePath: string): ConfigFile {
    const resolvedPath = PathUtils.resolve(basePath);
    
    for (const filename of this.CONFIG_FILENAMES) {
      const configPath = join(resolvedPath, filename);
      if (FileUtils.exists(configPath)) {
        return this.parseConfigFile(configPath);
      }
    }
    
    return this.loadPackageJsonConfig(resolvedPath);
  }

  private static parseConfigFile(path: string): ConfigFile {
    try {
      return FileUtils.readJson<ConfigFile>(path);
    } catch {
      return {};
    }
  }

  private static loadPackageJsonConfig(basePath: string): ConfigFile {
    const packagePath = join(basePath, 'package.json');
    if (!FileUtils.exists(packagePath)) return {};

    try {
      const pkg = FileUtils.readJson<any>(packagePath);
      return pkg.codemergeConfig || {};
    } catch {
      return {};
    }
  }

  public static merge(config: ConfigFile, options: Partial<MergeOptions>): MergeOptions {
    return {
      inputPath: options.inputPath || process.cwd(),
      outputPath: options.outputPath || config.outputPath || 'merged-output.txt',
      watch: options.watch ?? config.watch ?? false,
      ignorePatterns: options.ignorePatterns || config.ignorePatterns || this.DEFAULT_IGNORE_PATTERNS,
      includePatterns: options.includePatterns || config.includePatterns || this.DEFAULT_INCLUDE_PATTERNS
    };
  }
}`,

  'src/core/codeMerger.ts': `import { resolve, relative } from 'path';
import { glob } from 'glob';

import { FileUtils } from '../utils/fileUtils.js';
import { PathUtils } from '../utils/pathUtils.js';

import type { MergeOptions, MergeResult, FileData } from '../types';

export class CodeMerger {
  private options: MergeOptions;

  constructor(options: MergeOptions) {
    this.options = options;
  }

  public async execute(): Promise<MergeResult> {
    try {
      const files = await this.collectFiles();
      const content = this.mergeFiles(files);
      this.writeOutput(content);
      
      return {
        success: true,
        outputPath: this.options.outputPath,
        filesProcessed: files.length,
        errors: []
      };
    } catch (error) {
      return {
        success: false,
        outputPath: this.options.outputPath,
        filesProcessed: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  private async collectFiles(): Promise<FileData[]> {
    const files: FileData[] = [];
    const inputPath = resolve(this.options.inputPath);

    for (const pattern of this.options.includePatterns) {
      const matchedFiles = await glob(pattern, {
        cwd: inputPath,
        ignore: this.options.ignorePatterns,
        nodir: true
      });

      for (const file of matchedFiles) {
        const fullPath = resolve(inputPath, file);
        if (FileUtils.exists(fullPath) && FileUtils.isTextFile(fullPath)) {
          try {
            files.push({
              path: fullPath,
              content: FileUtils.read(fullPath),
              relativePath: relative(inputPath, fullPath)
            });
          } catch (error) {
            continue;
          }
        }
      }
    }

    return files.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
  }

  private mergeFiles(files: FileData[]): string {
    const header = this.generateHeader(files.length);
    const separator = '='.repeat(80);
    
    const mergedContent = files.map(file => {
      const fileSeparator = '-'.repeat(40);
      return [
        'STARTOFFILE: ' + file.relativePath,
        fileSeparator,
        file.content,
        fileSeparator,
        'ENDOFFILE: ' + file.relativePath,
        ''
      ].join('\\n');
    }).join('\\n');

    return [header, separator, '', mergedContent].join('\\n');
  }

  private generateHeader(fileCount: number): string {
    const timestamp = new Date().toISOString();
    return [
      '# Code Merge Output',
      'Generated at: ' + timestamp,
      'Source path: ' + this.options.inputPath,
      'Files processed: ' + fileCount
    ].join('\\n');
  }

  private writeOutput(content: string): void {
    FileUtils.write(this.options.outputPath, content);
  }
}`,

  'src/core/fileTemplates.ts': `export const FILE_TEMPLATES = {};`,

  'src/core/fileGenerator.ts': `import { mkdirSync } from 'fs';
import { join, dirname } from 'path';

import { FileUtils } from '../utils/fileUtils.js';
import { FILE_TEMPLATES } from './fileTemplates.js';

export interface GenerateResult {
  success: boolean;
  filesCreated: number;
  errors: string[];
}

export class FileGenerator {
  private basePath: string;

  constructor(basePath: string) {
    this.basePath = basePath;
  }

  public generate(force: boolean = false): GenerateResult {
    const filesCreated: string[] = [];
    const errors: string[] = [];

    for (const [filePath, content] of Object.entries(FILE_TEMPLATES)) {
      try {
        const fullPath = join(this.basePath, filePath);
        
        if (!force && FileUtils.exists(fullPath)) {
          errors.push('File already exists: ' + filePath);
          continue;
        }

        this.ensureDirectory(dirname(fullPath));
        FileUtils.write(fullPath, content);
        filesCreated.push(filePath);
      } catch (error) {
        errors.push('Failed to create ' + filePath + ': ' + (error instanceof Error ? error.message : 'Unknown error'));
      }
    }

    return {
      success: errors.length === 0,
      filesCreated: filesCreated.length,
      errors
    };
  }

  private ensureDirectory(dirPath: string): void {
    if (!FileUtils.exists(dirPath)) {
      mkdirSync(dirPath, { recursive: true });
    }
  }
}`,

  'src/commands/use.ts': `import { Command } from 'commander';

import { CodeMerger } from '../core/codeMerger.js';
import { Config } from '../core/config.js';
import { Logger } from '../utils/logger.js';

import type { CommandOptions } from '../types';

export class UseCommand {
  public register(program: Command): void {
    program.command('use').description('Merge code files into a single output file').argument('[path]', 'Input path to scan', '.').option('-o, --output <path>', 'Output file path').option('-w, --watch', 'Watch for file changes').option('--ignore <patterns>', 'Additional ignore patterns (comma-separated)').option('--include <patterns>', 'Include patterns (comma-separated)').action(this.execute.bind(this));
  }

  private async execute(inputPath: string, options: CommandOptions): Promise<void> {
    try {
      Logger.info('Starting code merge...');
      
      const config = Config.load(inputPath);
      const mergeOptions = Config.merge(config, {
        inputPath,
        outputPath: options.output,
        watch: options.watch,
        ignorePatterns: options.ignore ? options.ignore.split(',') : undefined,
        includePatterns: options.include ? options.include.split(',') : undefined
      });
      
      const merger = new CodeMerger(mergeOptions);
      const result = await merger.execute();
      
      if (result.success) {
        Logger.success('Merged ' + result.filesProcessed + ' files into ' + result.outputPath);
      } else {
        Logger.error('Merge failed:');
        result.errors.forEach(error => Logger.error('  ' + error));
        process.exit(1);
      }
    } catch (error) {
      Logger.error(error instanceof Error ? error.message : 'Unexpected error occurred');
      process.exit(1);
    }
  }
}`,

  'src/commands/init.ts': `import { Command } from 'commander';

import { FileGenerator } from '../core/fileGenerator.js';
import { Logger } from '../utils/logger.js';
import { PathUtils } from '../utils/pathUtils.js';

interface InitOptions {
  force?: boolean;
}

export class InitCommand {
  public register(program: Command): void {
    program.command('init').description('Initialize CodeMerge project structure').argument('[path]', 'Target directory', '.').option('-f, --force', 'Overwrite existing files').action(this.execute.bind(this));
  }

  private async execute(targetPath: string, options: InitOptions): Promise<void> {
    try {
      Logger.info('Initializing CodeMerge project...');
      
      const resolvedPath = PathUtils.resolve(targetPath);
      const generator = new FileGenerator(resolvedPath);
      const result = generator.generate(options.force || false);
      
      if (result.success) {
        Logger.success('Created ' + result.filesCreated + ' files successfully');
        Logger.plain('');
        Logger.plain('Next steps:');
        Logger.plain('  1. npm install');
        Logger.plain('  2. npm run build');
        Logger.plain('  3. npm start use');
      } else {
        Logger.warning('Created ' + result.filesCreated + ' files with ' + result.errors.length + ' errors:');
        result.errors.forEach(error => Logger.error('  ' + error));
        if (!options.force) {
          Logger.plain('');
          Logger.plain('Use --force to overwrite existing files');
        }
      }
    } catch (error) {
      Logger.error(error instanceof Error ? error.message : 'Unexpected error occurred');
      process.exit(1);
    }
  }
}`,

  'src/cli.ts': `#!/usr/bin/env node

import { Command } from 'commander';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

import { UseCommand } from './commands/use.js';
import { InitCommand } from './commands/init.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class CLI {
  private program: Command;

  constructor() {
    this.program = new Command();
    this.setupProgram();
    this.registerCommands();
  }

  private setupProgram(): void {
    const packagePath = join(__dirname, '../package.json');
    const packageJson = JSON.parse(readFileSync(packagePath, 'utf-8'));
    
    this.program.name('codemerge').description('AI-focused code and data preparation utility').version(packageJson.version);
  }

  private registerCommands(): void {
    const useCommand = new UseCommand();
    useCommand.register(this.program);

    const initCommand = new InitCommand();
    initCommand.register(this.program);
  }

  public run(): void {
    this.program.parse(process.argv);
  }
}

const cli = new CLI();
cli.run();`
};

function ensureDir(path) {
  if (!existsSync(path)) {
    mkdirSync(path, { recursive: true });
  }
}

function createFiles(basePath, force = false) {
  let created = 0;
  let skipped = 0;

  console.log('🚀 Creating CodeMerge project structure...\n');

  for (const [filePath, content] of Object.entries(templates)) {
    const fullPath = join(basePath, filePath);
    const lastSlash = Math.max(fullPath.lastIndexOf('/'), fullPath.lastIndexOf('\\'));
    const fileDir = lastSlash > 0 ? fullPath.substring(0, lastSlash) : basePath;

    if (existsSync(fullPath) && !force) {
      console.log('⏭️  Skipped: ' + filePath + ' (already exists)');
      skipped++;
      continue;
    }

    ensureDir(fileDir);
    writeFileSync(fullPath, content, 'utf-8');
    console.log('✅ Created: ' + filePath);
    created++;
  }

  console.log('\n📊 Summary: ' + created + ' created, ' + skipped + ' skipped');
  console.log('\n📦 Next steps:');
  console.log('  1. npm install');
  console.log('  2. npm run build');
  console.log('  3. npm start use');
}

const args = process.argv.slice(2);
const targetPath = args[0] || '.';
const force = args.includes('--force') || args.includes('-f');

createFiles(targetPath, force);