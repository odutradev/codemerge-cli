# CodeMerge CLI

AI-focused code and data preparation utility. Merge multiple files into a single output optimized for AI context windows, with HTTP API for dynamic content generation.

## 📋 Table of Contents

  - [Overview](https://www.google.com/search?q=%23overview)
  - [Installation](https://www.google.com/search?q=%23installation)
  - [Quick Start](https://www.google.com/search?q=%23quick-start)
  - [Commands](https://www.google.com/search?q=%23commands)
  - [Configuration](https://www.google.com/search?q=%23configuration)
  - [HTTP Server & API](https://www.google.com/search?q=%23http-server--api)
  - [Use Cases](https://www.google.com/search?q=%23use-cases)
  - [Advanced Usage](https://www.google.com/search?q=%23advanced-usage)
  - [Troubleshooting](https://www.google.com/search?q=%23troubleshooting)

-----

## 🎯 Overview

CodeMerge is a CLI tool that:

  - **Merges** multiple code files into a single, structured text file
  - **Optimizes** output for AI tools (ChatGPT, Claude, etc.)
  - **Respects** .gitignore patterns and custom ignore rules
  - **Watches** for file changes and auto-regenerates
  - **Serves** content via HTTP API for dynamic access
  - **Provides** project structure visualization in JSON
  - **Enables** selective file merging via API
  - **Executes** system commands upon file updates (Upsert hooks)

Perfect for:

  - Preparing codebases for AI analysis
  - Generating context for code reviews
  - Creating documentation snapshots
  - Sharing project structure with AI assistants
  - Building AI-powered developer tools

-----

## 📦 Installation

### Global Installation (Recommended)

```bash
npm install -g codemerge-cli
```

### Local Project Installation

```bash
npm install --save-dev codemerge-cli
```

### Requirements

  - Node.js \>= 16.0.0

-----

## 🚀 Quick Start

### 1\. Initialize Project

```bash
# Initialize in current directory
codemerge init

# Initialize in specific directory
codemerge init ./my-project

# Force overwrite existing config
codemerge init --force
```

This creates:

  - `codemerge.json` - Configuration file
  - Updates `.gitignore` - Adds output file

### 2\. Merge Files

```bash
# Merge current directory
codemerge use

# Merge specific directory
codemerge use ./src

# Custom output file
codemerge use --output my-code.txt

# Watch for changes
codemerge use --watch
```

### 3\. Start HTTP Server

```bash
# Start server on default port (9876)
codemerge watch

# Custom port
codemerge watch --port 3000

# Custom output and filters
codemerge watch --output api-code.txt --ignore "*.test.ts"
```

-----

## 🎮 Commands

### `codemerge init`

Initialize CodeMerge in a project.

```bash
codemerge init [path] [options]
```

**Arguments:**

  - `path` - Target directory (default: `.`)

**Options:**

  - `-f, --force` - Overwrite existing configuration

**What it does:**

  - Creates `codemerge.json` with default settings
  - Detects project name from `package.json`
  - Adds output file to `.gitignore`
  - Sets up recommended ignore patterns

**Example:**

```bash
codemerge init ./backend --force
```

-----

### `codemerge use`

Merge code files into a single output.

```bash
codemerge use [path] [options]
```

**Arguments:**

  - `path` - Input directory to scan (default: `.`)

**Options:**

  - `-o, --output <path>` - Custom output file path
  - `-w, --watch` - Watch for file changes
  - `--ignore <patterns>` - Additional ignore patterns (comma-separated)
  - `--include <patterns>` - Include patterns (comma-separated)

**Examples:**

```bash
# Basic merge
codemerge use

# Merge src folder only
codemerge use ./src

# Custom output
codemerge use --output ai-context.txt

# Watch mode
codemerge use --watch

# Custom filters
codemerge use --ignore "*.test.ts,*.spec.js" --include "***.js"

# Combine options
codemerge use ./src --output src-merged.txt --watch
```

**Output Format:**

```
# Code Merge Output
Generated at: 2026-01-07T01:02:50.588Z
Source path: .
Files processed: 21
Total lines: 1596
Total characters: 45777

File types:
  - ts: 17 files (1442 lines)
  - json: 2 files (80 lines)
  - js: 1 files (2 lines)

Project structure & file index:
./
  lib/
    - cli.ts (75 lines)
    core/
      - codeMerger.ts (273 lines)

================================================================================

STARTOFFILE: lib/cli.ts
----------------------------------------
[file content here]
----------------------------------------
ENDOFFILE: lib/cli.ts
```

-----

### `codemerge watch`

Start HTTP server with file watching.

```bash
codemerge watch [path] [options]
```

**Arguments:**

  - `path` - Input directory to scan (default: `.`)

**Options:**

  - `-o, --output <path>` - Output file path
  - `-p, --port <number>` - Server port (default: `9876`)
  - `--ignore <patterns>` - Additional ignore patterns
  - `--include <patterns>` - Include patterns

**Examples:**

```bash
# Start server on default port
codemerge watch

# Custom port
codemerge watch --port 8080

# Watch specific directory
codemerge watch ./src --port 3000

# With filters
codemerge watch --ignore "*.test.ts" --include "***.tsx"
```

**Server Endpoints:**

  - `GET /health` - Server health status
  - `GET /content` - Full merged content
  - `GET /structure` - Project structure JSON
  - `POST /selective-content` - Merge selected files
  - `POST /upsert` - Create/update files
  - `GET /command-output` - Get output of the last post-upsert command

See [HTTP Server & API](https://www.google.com/search?q=%23http-server--api) for details.

-----

### `codemerge help`

Display help information.

```bash
codemerge help [command]
```

**Examples:**

```bash
# General help
codemerge help

# Command-specific help
codemerge help init
codemerge help use
codemerge help watch
```

-----

### `codemerge version`

Display version information.

```bash
codemerge version
```

-----

## ⚙️ Configuration

### Configuration File: `codemerge.json`

```json
{
  "projectName": "my-project",
  "outputPath": "merged-output.txt",
  "port": 9876,
  "useGitignore": true,
  "onUpsertCommand": "npm run build",
  "ignorePatterns": [
    "node_modules*.log",
    "coverage*.ts",
    "***.tsx",
    "***.json",
    "***.log",
    "package-lock.json",
    "yarn.lock",
    ".env",
    "**/.DS_Store"
  ]
}
```

**New Option:** `onUpsertCommand` allows defining a shell command to be executed immediately after a successful POST to `/upsert`.

### Default Include Patterns

```javascript
[
  '***.js',
  '***.jsx',
  '***.md'
]
```

### Alternative: package.json Configuration

You can also configure in `package.json`:

```json
{
  "name": "my-project",
  "codemergeConfig": {
    "outputPath": "ai-digest.txt",
    "onUpsertCommand": "echo 'Upsert complete'",
    "ignorePatterns": ["***.ts"]
  }
}
```

-----

## 🌐 HTTP Server & API

### Starting the Server

```bash
codemerge watch --port 9876
```

### API Endpoints

#### 1\. Health Check

**GET** `/health`

Check server status.

**Response:**

```json
{
  "status": "ok",
  "project": "my-project",
  "endpoints": {
    "merge": "/content",
    "structure": "/structure",
    "selectiveContent": "/selective-content",
    "upsert": "/upsert",
    "commandOutput": "/command-output",
    "health": "/health"
  },
  "mergeReady": true
}
```

**Example:**

```bash
curl http://localhost:9876/health
```

-----

#### 2\. Get Merged Content

**GET** `/content`

Get full merged content of all files.

**Response:**

```
# Code Merge Output
Generated at: 2026-01-07T01:02:50.588Z
...
[merged content]
```

**Example:**

```bash
curl http://localhost:9876/content > output.txt
```

-----

#### 3\. Get Project Structure

**GET** `/structure`

Get project structure as JSON tree.

**Response:**

```json
{
  "root": {
    "name": ".",
    "type": "directory",
    "path": ".",
    "children": [
      {
        "name": "package.json",
        "type": "file",
        "path": "package.json",
        "lines": 55
      },
      {
        "name": "src",
        "type": "directory",
        "path": "src",
        "children": [
          {
            "name": "index.ts",
            "type": "file",
            "path": "src/index.ts",
            "lines": 120
          }
        ]
      }
    ]
  },
  "totalFiles": 21,
  "totalDirectories": 8,
  "fileTypes": {
    "ts": 17,
    "json": 2,
    "js": 1,
    "md": 1
  }
}
```

**Example:**

```bash
curl http://localhost:9876/structure | jq
```

**Frontend Integration:**

```javascript
async function getProjectStructure() {
  const response = await fetch('http://localhost:9876/structure');
  const structure = await response.json();
  return structure;
}
```

-----

#### 4\. Get Selective Content

**POST** `/selective-content`

Merge only selected files/folders.

**Request Body:**

```json
{
  "selectedPaths": [
    "src/core/codeMerger.ts",
    "src/types",
    "package.json"
  ]
}
```

**Response:**

```
# Code Merge Output
Generated at: 2026-01-07T01:02:50.588Z
Files processed: 5
...
[merged content of selected files]
```

**Example:**

```bash
curl -X POST http://localhost:9876/selective-content \
  -H "Content-Type: application/json" \
  -d '{
    "selectedPaths": [
      "src/core",
      "package.json"
    ]
  }' > selected-output.txt
```

**Frontend Integration:**

```javascript
async function getSelectiveContent(selectedPaths) {
  const response = await fetch('http://localhost:9876/selective-content', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ selectedPaths })
  });
  return await response.text();
}
const content = await getSelectiveContent([
  'src/core/codeMerger.ts',
  'src/types'
]);
```

**Note:** When you select a folder, all files within it are automatically included.

-----

#### 5\. Upsert Files

**POST** `/upsert`

Create or update files in the project. If `onUpsertCommand` is configured, it will be executed after a successful upsert.

**Request Body:**

```json
{
  "basePath": "./",
  "files": [
    {
      "path": "src/new-file.ts",
      "content": "export const hello = 'world';"
    },
    {
      "path": "README.md",
      "content": "# Updated content"
    }
  ]
}
```

**Response:**

```json
{
  "success": true,
  "filesProcessed": 2,
  "errors": [],
  "results": [
    {
      "path": "src/new-file.ts",
      "action": "created",
      "success": true
    },
    {
      "path": "README.md",
      "action": "updated",
      "success": true
    }
  ]
}
```

**Example:**

```bash
curl -X POST http://localhost:9876/upsert \
  -H "Content-Type: application/json" \
  -d '{
    "files": [
      {
        "path": "src/hello.ts",
        "content": "console.log(\"Hello\");"
      }
    ]
  }'
```

-----

#### 6\. Get Command Output

**GET** `/command-output`

Retrieves the result (stdout/stderr) of the last executed command triggered by an upsert operation. Requires `onUpsertCommand` to be set in configuration.

**Response:**

```json
{
  "timestamp": "2026-02-13T12:30:00.000Z",
  "command": "npm run build",
  "output": "Build successful...",
  "error": null,
  "success": true
}
```

OR (if no command was executed):

```json
{
  "status": "no_command_executed"
}
```

**Example:**

```bash
curl http://localhost:9876/command-output
```

-----

## 💡 Use Cases

### 1\. AI Code Analysis

Prepare your entire codebase for AI analysis:

```bash
# Generate merged file
codemerge use --output for-ai.txt

# Copy content and paste into ChatGPT/Claude
cat for-ai.txt | pbcopy  # macOS
cat for-ai.txt | xclip   # Linux
```

### 2\. Code Review Context

Generate context for code reviews:

```bash
# Merge only source files
codemerge use ./src --output review-context.txt --ignore "*.test.ts,*.spec.js"
```

### 3\. Documentation Generation

Create documentation snapshots:

```bash
# Include docs and source
codemerge use --include "***.ts" --output docs-snapshot.txt
```

### 4\. AI-Powered Developer Tools

Build tools that need dynamic project access:

```javascript
const structure = await fetch('http://localhost:9876/structure').then(r => r.json());
const selectedPaths = userSelection;
const content = await fetch('http://localhost:9876/selective-content', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ selectedPaths })
}).then(r => r.text());
await sendToAI(content);
```

### 5\. Continuous Context Updates

Watch mode for real-time updates:

```bash
# Terminal 1: Watch and serve
codemerge watch --port 3000

# Terminal 2: Your app constantly fetches latest
while true; do
  curl http://localhost:3000/content > latest.txt
  sleep 5
done
```

### 6\. Multi-Project Monitoring

Monitor multiple projects:

```bash
# Project 1
cd ~/project1 && codemerge watch --port 9001

# Project 2
cd ~/project2 && codemerge watch --port 9002

# Project 3
cd ~/project3 && codemerge watch --port 9003
```

-----

## 🔧 Advanced Usage

### Custom Patterns

#### Include TypeScript Only

```bash
codemerge use --include "***.tsx"
```

#### Exclude Tests and Configs

```bash
codemerge use --ignore "***.spec.js,***.ts,lib*.ts"
```

### Combining Options

```bash
codemerge use \
  ./backend \
  --output backend-code.txt \
  --watch \
  --ignore "**migrations*.ts,***.ts", "***.test.ts", "***.json,***.min.js"

# Include only specific types
codemerge use --include "***.png,***.pdf"
```

-----

## 📚 Additional Resources

  - **GitHub:** [github.com/odutradev/codemerge-cli](https://github.com/odutradev/codemerge-cli)
  - **Issues:** [Report bugs](https://github.com/odutradev/codemerge-cli/issues)
  - **NPM:** [npmjs.com/package/codemerge-cli](https://www.npmjs.com/package/codemerge-cli)

-----

## 📝 License

MIT License - feel free to use in your projects\!

-----

## 🤝 Contributing

Contributions welcome\! Please:

1.  Fork the repository
2.  Create a feature branch
3.  Make your changes
4.  Submit a pull request