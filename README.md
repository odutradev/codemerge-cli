# CodeMerge CLI

AI-focused code and data preparation utility. Merge multiple files into a single output optimized for AI context windows, with HTTP API for dynamic content generation.

## 📋 Table of Contents

- [Overview](#overview)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Commands](#commands)
- [Configuration](#configuration)
- [HTTP Server & API](#http-server--api)
- [Use Cases](#use-cases)
- [Advanced Usage](#advanced-usage)
- [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

CodeMerge is a CLI tool that:

- **Merges** multiple code files into a single, structured text file
- **Optimizes** output for AI tools (ChatGPT, Claude, etc.)
- **Respects** .gitignore patterns and custom ignore rules
- **Watches** for file changes and auto-regenerates
- **Serves** content via HTTP API for dynamic access
- **Provides** project structure visualization in JSON
- **Enables** selective file merging via API

Perfect for:
- Preparing codebases for AI analysis
- Generating context for code reviews
- Creating documentation snapshots
- Sharing project structure with AI assistants
- Building AI-powered developer tools

---

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

---

## 🚀 Quick Start

### 1. Initialize Project

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

### 2. Merge Files

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

### 3. Start HTTP Server

```bash
# Start server on default port (9876)
codemerge watch

# Custom port
codemerge watch --port 3000

# Custom output and filters
codemerge watch --output api-code.txt --ignore "*.test.ts"
```

---

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

---

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
codemerge use --ignore "*.test.ts,*.spec.js" --include "**/*.ts,**/*.js"

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

---

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
codemerge watch --ignore "*.test.ts" --include "**/*.ts,**/*.tsx"
```

**Server Endpoints:**
- `GET /health` - Server health status
- `GET /content` - Full merged content
- `GET /structure` - Project structure JSON
- `POST /selective-content` - Merge selected files
- `POST /upsert` - Create/update files

See [HTTP Server & API](#http-server--api) for details.

---

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

---

### `codemerge version`

Display version information.

```bash
codemerge version
```

---

## ⚙️ Configuration

### Configuration File: `codemerge.json`

```json
{
  "projectName": "my-project",
  "outputPath": "merged-output.txt",
  "port": 9876,
  "useGitignore": true,
  "ignorePatterns": [
    "node_modules/**",
    ".git/**",
    "dist/**",
    "build/**",
    "**/*.log",
    "coverage/**"
  ],
  "includePatterns": [
    "**/*.ts",
    "**/*.js",
    "**/*.tsx",
    "**/*.jsx",
    "**/*.json",
    "**/*.md"
  ]
}
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `projectName` | `string` | Auto-detected | Project name |
| `outputPath` | `string` | `merged-output.txt` | Output file path |
| `port` | `number` | `9876` | HTTP server port |
| `useGitignore` | `boolean` | `true` | Respect .gitignore rules |
| `ignorePatterns` | `string[]` | See below | Files/folders to ignore |
| `includePatterns` | `string[]` | See below | Files to include |

### Default Ignore Patterns

```javascript
[
  'node_modules/**',
  '.git/**',
  'dist/**',
  'build/**',
  'coverage/**',
  '**/*.log',
  'package-lock.json',
  'yarn.lock',
  '.env',
  '**/.DS_Store'
]
```

### Default Include Patterns

```javascript
[
  '**/*.ts',
  '**/*.js',
  '**/*.tsx',
  '**/*.jsx',
  '**/*.json',
  '**/*.md'
]
```

### Alternative: package.json Configuration

You can also configure in `package.json`:

```json
{
  "name": "my-project",
  "codemergeConfig": {
    "outputPath": "ai-digest.txt",
    "ignorePatterns": ["**/*.test.ts"],
    "includePatterns": ["src/**/*.ts"]
  }
}
```

---

## 🌐 HTTP Server & API

### Starting the Server

```bash
codemerge watch --port 9876
```

### API Endpoints

#### 1. Health Check

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
    "health": "/health"
  },
  "mergeReady": true
}
```

**Example:**
```bash
curl http://localhost:9876/health
```

---

#### 2. Get Merged Content

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

---

#### 3. Get Project Structure

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

---

#### 4. Get Selective Content

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

// Usage
const content = await getSelectiveContent([
  'src/core/codeMerger.ts',
  'src/types'
]);
```

**Note:** When you select a folder, all files within it are automatically included.

---

#### 5. Upsert Files

**POST** `/upsert`

Create or update files in the project.

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

---

## 💡 Use Cases

### 1. AI Code Analysis

Prepare your entire codebase for AI analysis:

```bash
# Generate merged file
codemerge use --output for-ai.txt

# Copy content and paste into ChatGPT/Claude
cat for-ai.txt | pbcopy  # macOS
cat for-ai.txt | xclip   # Linux
```

### 2. Code Review Context

Generate context for code reviews:

```bash
# Merge only source files
codemerge use ./src --output review-context.txt --ignore "*.test.ts,*.spec.js"
```

### 3. Documentation Generation

Create documentation snapshots:

```bash
# Include docs and source
codemerge use --include "**/*.md,**/*.ts" --output docs-snapshot.txt
```

### 4. AI-Powered Developer Tools

Build tools that need dynamic project access:

```javascript
// Get project structure
const structure = await fetch('http://localhost:9876/structure').then(r => r.json());

// Let user select files in UI
const selectedPaths = userSelection;

// Get only selected content
const content = await fetch('http://localhost:9876/selective-content', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ selectedPaths })
}).then(r => r.text());

// Send to AI
await sendToAI(content);
```

### 5. Continuous Context Updates

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

### 6. Multi-Project Monitoring

Monitor multiple projects:

```bash
# Project 1
cd ~/project1 && codemerge watch --port 9001

# Project 2
cd ~/project2 && codemerge watch --port 9002

# Project 3
cd ~/project3 && codemerge watch --port 9003
```

---

## 🔧 Advanced Usage

### Custom Patterns

#### Include TypeScript Only
```bash
codemerge use --include "**/*.ts,**/*.tsx"
```

#### Exclude Tests and Configs
```bash
codemerge use --ignore "**/*.test.ts,**/*.spec.js,**/*.config.js"
```

#### Specific Directories
```bash
codemerge use --include "src/**/*.ts,lib/**/*.ts"
```

### Combining Options

```bash
codemerge use \
  ./backend \
  --output backend-code.txt \
  --watch \
  --ignore "**/*.test.ts,**/migrations/**" \
  --include "**/*.ts,**/*.js"
```

### Environment-Specific Configs

Create multiple config files:

**codemerge.dev.json:**
```json
{
  "outputPath": "dev-merged.txt",
  "includePatterns": ["**/*.ts", "**/*.tsx"]
}
```

**codemerge.prod.json:**
```json
{
  "outputPath": "prod-merged.txt",
  "ignorePatterns": ["**/*.test.ts", "**/*.dev.ts"]
}
```

Use with symbolic links:
```bash
ln -sf codemerge.dev.json codemerge.json
codemerge use
```

### Scripting

**package.json:**
```json
{
  "scripts": {
    "merge": "codemerge use",
    "merge:watch": "codemerge use --watch",
    "serve": "codemerge watch --port 3000",
    "merge:src": "codemerge use ./src --output src-only.txt"
  }
}
```

```bash
npm run merge
npm run serve
```

### CI/CD Integration

**GitHub Actions:**
```yaml
- name: Generate Code Context
  run: |
    npm install -g codemerge-cli
    codemerge use --output code-context.txt
    
- name: Upload Artifact
  uses: actions/upload-artifact@v2
  with:
    name: code-context
    path: code-context.txt
```

---

## 🐛 Troubleshooting

### Port Already in Use

```
Error: Port 9876 is already in use
```

**Solution:**
```bash
# Use different port
codemerge watch --port 8080

# Or find and kill the process
lsof -ti:9876 | xargs kill -9
```

### Large Output Files

If output is too large:

```bash
# Limit to specific directories
codemerge use ./src ./lib

# Exclude verbose files
codemerge use --ignore "**/*.json,**/*.lock,**/*.min.js"

# Include only specific types
codemerge use --include "**/*.ts"
```

### Files Not Being Merged

**Check .gitignore:**
```bash
# Disable gitignore checking
# Edit codemerge.json:
{
  "useGitignore": false
}
```

**Check patterns:**
```bash
# Add debug logging (in code)
console.log('Include patterns:', includePatterns);
console.log('Ignore patterns:', ignorePatterns);
```

### Watch Not Detecting Changes

**Increase delay:**
Edit `codemerge.json`:
```json
{
  "watchDelay": 3000
}
```

**Check file permissions:**
```bash
ls -la | grep codemerge
```

### Binary Files in Output

Binary files are automatically excluded. If you see them:

```bash
# Explicitly ignore
codemerge use --ignore "**/*.png,**/*.jpg,**/*.pdf"
```

---

## 📚 Additional Resources

- **GitHub:** [github.com/odutradev/codemerge-cli](https://github.com/odutradev/codemerge-cli)
- **Issues:** [Report bugs](https://github.com/odutradev/codemerge-cli/issues)
- **NPM:** [npmjs.com/package/codemerge-cli](https://www.npmjs.com/package/codemerge-cli)

---

## 📝 License

MIT License - feel free to use in your projects!

---

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request