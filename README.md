# CodeMerge

AI-focused code and data preparation utility.

## Bootstrap (Create New Project)

To create a new CodeMerge project from scratch:

```bash
# Using bootstrap script
node bootstrap.js [target-directory] [--force]

# Examples
node bootstrap.js
node bootstrap.js ./my-project
node bootstrap.js . --force
```

## Installation

```bash
npm install -g codemerge
```

## Quick Start

```bash
# Merge current directory
codemerge use

# Merge specific directory
codemerge use ./src

# Custom output
codemerge use --output ai-digest.txt

# With filters
codemerge use --ignore "*.log,*.test.ts"
codemerge use --include "**/*.ts,**/*.js"
```

## Configuration

Create `codemerge.json` in your project root:

```json
{
  "outputPath": "ai-digest.txt",
  "ignorePatterns": ["node_modules/**", "dist/**"],
  "includePatterns": ["**/*.ts", "**/*.js"]
}
```

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Development mode
npm run dev

# Run locally
npm start use
```

## License

MIT