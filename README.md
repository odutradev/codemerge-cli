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
  - **Manages** file deletions and local git commits via API

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

  - Node.js >= 16.0.0

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
  - `POST /delete-files` - Delete specific files
  - `POST /commit` - Execute local git commit
  - `GET /command-output` - Get output of the last post-upsert command

See HTTP Server & API for details.

-----

### `codemerge help`

Display help information.

```bash
codemerge help [command]
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
    "deleteFiles": "/delete-files",
    "commit": "/commit",
    "commandOutput": "/command-output",
    "health": "/health"
  },
  "mergeReady": true
}
```

-----

#### 2\. Get Merged Content

**GET** `/content`

Get full merged content of all files.

-----

#### 3\. Get Project Structure

**GET** `/structure`

Get project structure as JSON tree.

-----

#### 4\. Get Selective Content

**POST** `/selective-content`

Merge only selected files/folders.

-----

#### 5\. Upsert Files

**POST** `/upsert`

Create or update files in the project. If `onUpsertCommand` is configured, it will be executed after a successful upsert.

-----

#### 6\. Delete Files

**POST** `/delete-files`

Delete specific files from the project.

**Request Body:**

```json
{
  "basePath": "./",
  "files": [
    "src/obsolete-file.ts",
    "tests/old-test.spec.ts"
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
      "path": "src/obsolete-file.ts",
      "success": true
    },
    {
      "path": "tests/old-test.spec.ts",
      "success": true
    }
  ]
}
```

-----

#### 7\. Local Git Commit

**POST** `/commit`

Execute a local git commit for all changes in the current directory (`git add .` followed by `git commit -m "..."`).

**Request Body:**

```json
{
  "basePath": "./",
  "message": "feat: add new dynamic endpoints for server management"
}
```

**Response:**

```json
{
  "success": true,
  "output": "[main 4c83b2a] feat: add new dynamic endpoints for server management\n 2 files changed, 45 insertions(+)",
  "error": null
}
```

-----

#### 8\. Get Command Output

**GET** `/command-output`

Retrieves the result (stdout/stderr) of the last executed command triggered by an upsert operation. Requires `onUpsertCommand` to be set in configuration.

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