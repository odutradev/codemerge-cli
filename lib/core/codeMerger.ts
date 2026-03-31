import { resolve, relative, basename, join } from 'path'
import { promises } from 'fs'

import { Pattern } from '@utils/pattern.js'
import { File } from '@utils/file.js'

import type { ProjectStructure, ProjectNode, MergeOptions, MergeResult, FileData } from '@type/merge.js'

export class CodeMerger {
  private options: MergeOptions

  constructor(options: MergeOptions) {
    this.options = options
  }

  public execute = async (): Promise<MergeResult> => {
    try {
      const files = await this.collectFiles()
      const content = this.mergeFiles(files)

      if (this.options.writeOutput) this.writeOutput(content)

      return {
        success: true,
        outputPath: this.options.outputPath,
        filesProcessed: files.length,
        errors: [],
        content
      }
    } catch (error) {
      return {
        success: false,
        outputPath: this.options.outputPath,
        filesProcessed: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }
    }
  }

  public getProjectStructure = async (): Promise<ProjectStructure> => {
    const files = await this.collectFiles()
    const root = this.buildTreeStructure(files)

    const fileTypes: Record<string, number> = {}
    let totalDirectories = 0

    const countNodes = (node: ProjectNode) => {
      if (node.type === 'directory') {
        totalDirectories++
        node.children?.forEach(countNodes)
      } else {
        const ext = node.name.split('.').pop() || 'unknown'
        fileTypes[ext] = (fileTypes[ext] || 0) + 1
      }
    }

    countNodes(root)

    return {
      root,
      totalFiles: files.length,
      totalDirectories,
      fileTypes
    }
  }

  public getSelectiveContent = async (selectedPaths: string[]): Promise<MergeResult> => {
    try {
      const allFiles = await this.collectFiles()
      const selectedFiles = allFiles.filter(file =>
        selectedPaths.some(selected => {
          const normalizedSelected = selected.replace(/\\/g, '/')
          const normalizedFile = file.relativePath.replace(/\\/g, '/')
          return normalizedFile === normalizedSelected || normalizedFile.startsWith(`${normalizedSelected}/`)
        })
      )

      const content = this.mergeFiles(selectedFiles)

      return {
        success: true,
        outputPath: this.options.outputPath,
        filesProcessed: selectedFiles.length,
        errors: [],
        content
      }
    } catch (error) {
      return {
        success: false,
        outputPath: this.options.outputPath,
        filesProcessed: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }
    }
  }

  private buildTreeStructure = (files: FileData[]): ProjectNode => {
    const rootName = this.options.projectName || basename(resolve(this.options.inputPath)) || '.'
    const root: ProjectNode = {
      name: rootName,
      type: 'directory',
      path: '.',
      children: []
    }

    const nodeMap = new Map<string, ProjectNode>()
    nodeMap.set('.', root)

    files.forEach(file => {
      const parts = file.relativePath.split(/[/\\]/)
      let currentPath = '.'

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i]
        const isFile = i === parts.length - 1
        const newPath = currentPath === '.' ? part : `${currentPath}/${part}`

        if (!nodeMap.has(newPath)) {
          const node: ProjectNode = {
            name: part,
            type: isFile ? 'file' : 'directory',
            path: newPath,
            ...(isFile && { lines: file.content.split('\n').length }),
            ...(!isFile && { children: [] })
          }

          const parentNode = nodeMap.get(currentPath)
          if (parentNode && parentNode.children) {
            parentNode.children.push(node)
          }

          nodeMap.set(newPath, node)
        }

        currentPath = newPath
      }
    })

    const sortNodes = (node: ProjectNode) => {
      if (node.children) {
        node.children.sort((a: ProjectNode, b: ProjectNode) => {
          if (a.type !== b.type) return a.type === 'directory' ? -1 : 1
          return a.name.localeCompare(b.name)
        })
        node.children.forEach(sortNodes)
      }
    }

    sortNodes(root)
    return root
  }

  private collectFiles = async (): Promise<FileData[]> => {
    const files: FileData[] = []
    const inputPath = resolve(this.options.inputPath)
    const ignorePatterns = this.getIgnorePatterns(inputPath)
    const includePatterns = this.options.includePatterns

    const ignoreRegexes = ignorePatterns.map(p => Pattern.globToRegex(p))
    const includeRegexes = includePatterns.map(p => Pattern.globToRegex(p))

    const walk = async (currentPath: string, relativeDir: string): Promise<void> => {
      try {
        const entries = await promises.readdir(currentPath, { withFileTypes: true })

        for (const entry of entries) {
          const relPath = relativeDir ? `${relativeDir}/${entry.name}` : entry.name
          const fullPath = join(currentPath, entry.name)

          if (ignoreRegexes.some(r => r.test(relPath))) continue

          if (entry.isDirectory()) {
            await walk(fullPath, relPath)
          } else if (entry.isFile()) {
            if (!includeRegexes.some(r => r.test(relPath))) continue

            if (this.shouldProcessFile(fullPath, inputPath) && File.isTextFile(fullPath)) {
              files.push({
                path: fullPath,
                content: File.read(fullPath),
                relativePath: relPath
              })
            }
          }
        }
      } catch {
        return
      }
    }

    await walk(inputPath, '')
    return files.sort((a, b) => a.relativePath.localeCompare(b.relativePath))
  }

  private shouldProcessFile = (fullPath: string, inputPath: string): boolean => {
    if (!File.exists(fullPath)) return false

    const relativePath = relative(inputPath, fullPath)
    const outputFileName = basename(this.options.outputPath)
    const configFiles = ['codemerge.json', 'codemerge.config.json']

    if (relativePath === outputFileName || configFiles.includes(relativePath)) return false
    return true
  }

  private getIgnorePatterns = (inputPath: string): string[] => {
    const patterns = new Set([...this.options.ignorePatterns])
    const outputFileName = basename(this.options.outputPath)

    patterns.add(outputFileName)
    patterns.add(`**/${outputFileName}`)
    patterns.add('codemerge.json')
    patterns.add('codemerge.config.json')

    const normalized = new Set<string>()

    patterns.forEach(p => {
      let pat = p.replace(/\\/g, '/')
      if (pat.startsWith('./')) pat = pat.slice(2)
      if (pat.endsWith('/')) pat = pat.slice(0, -1)

      normalized.add(pat)
      if (!pat.includes('*') && !pat.includes('/')) {
        normalized.add(`**/${pat}`)
        normalized.add(`**/${pat}/**`)
      }
    })

    return Array.from(normalized)
  }

  private mergeFiles = (files: FileData[]): string => {
    const totalLines = files.reduce((sum, file) => sum + file.content.split('\n').length, 0)
    const totalChars = files.reduce((sum, file) => sum + file.content.length, 0)
    const breakdown = this.generateBreakdown(files)
    const structure = this.generateStructure(files)
    const header = this.generateHeader(files.length, totalLines, totalChars, breakdown, structure)
    const separator = '='.repeat(80)

    const mergedContent = files.map(file => {
      const fileSeparator = '-'.repeat(40)
      return [
        `STARTOFFILE: ${file.relativePath}`,
        fileSeparator,
        file.content,
        fileSeparator,
        `ENDOFFILE: ${file.relativePath}`,
        ''
      ].join('\n')
    }).join('\n')

    return [header, separator, '', mergedContent].join('\n')
  }

  private generateHeader = (fileCount: number, totalLines: number, totalChars: number, breakdown: string, structure: string): string => {
    const timestamp = new Date().toISOString()
    return [
      '# Code Merge Output',
      `Generated at: ${timestamp}`,
      `Source path: ${this.options.inputPath}`,
      `Files processed: ${fileCount}`,
      `Total lines: ${totalLines}`,
      `Total characters: ${totalChars}`,
      '',
      breakdown,
      '',
      structure
    ].join('\n')
  }

  private generateBreakdown = (files: FileData[]): string => {
    const typeMap = new Map<string, { count: number; lines: number }>()

    files.forEach(file => {
      const ext = file.relativePath.split('.').pop() || 'unknown'
      const lines = file.content.split('\n').length
      const current = typeMap.get(ext) || { count: 0, lines: 0 }
      typeMap.set(ext, { count: current.count + 1, lines: current.lines + lines })
    })

    const sorted = Array.from(typeMap.entries()).sort((a, b) => b[1].count - a[1].count)
    const lines = sorted.map(([ext, data]) => `  - ${ext}: ${data.count} files (${data.lines.toLocaleString()} lines)`)

    return ['File types:', ...lines].join('\n')
  }

  private generateStructure = (files: FileData[]): string => {
    const tree: Record<string, FileData[]> = {}

    files.forEach(file => {
      const parts = file.relativePath.split(/[/\\]/)
      for (let i = 0; i < parts.length; i++) {
        const path = parts.slice(0, i + 1).join('/')
        const isFile = i === parts.length - 1
        if (isFile) {
          const dir = i === 0 ? '.' : parts.slice(0, i).join('/')
          if (!tree[dir]) tree[dir] = []
          tree[dir].push(file)
        }
      }
    })

    const sortedPaths = Object.keys(tree).sort()
    const rootName = this.options.projectName || basename(resolve(this.options.inputPath)) || '.'
    const rootLabel = rootName === '.' ? './' : `${rootName}/`
    const lines = ['Project structure & file index:', rootLabel]
    const processed = new Set<string>()

    sortedPaths.forEach(path => {
      const parts = path === '.' ? [] : path.split('/')
      const depth = parts.length

      parts.forEach((part, index) => {
        const currentPath = parts.slice(0, index + 1).join('/')
        if (!processed.has(currentPath)) {
          const indent = '  '.repeat(index + 1)
          lines.push(`${indent}${part}/`)
          processed.add(currentPath)
        }
      })

      const dirFiles = tree[path].sort((a, b) => a.relativePath.localeCompare(b.relativePath))
      dirFiles.forEach(file => {
        const fileName = file.relativePath.split(/[/\\]/).pop()!
        const lineCount = file.content.split('\n').length
        const indent = '  '.repeat(depth + 1)
        lines.push(`${indent}- ${fileName} (${lineCount.toLocaleString()} lines)`)
      })
    })

    return lines.join('\n')
  }

  private writeOutput = (content: string): void => File.write(this.options.outputPath, content)
}
