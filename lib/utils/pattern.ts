export class Pattern {
  public static parseGitignorePatterns = (content: string): string[] => {
    const patterns: string[] = []
    
    content.split('\n').forEach(line => {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('!')) return
      patterns.push(...this.convertGitignorePattern(trimmed))
    })
    
    return patterns
  }

  private static convertGitignorePattern = (pattern: string): string[] => {
    const patterns: string[] = []
    let p = pattern
    
    const isRootRelative = p.startsWith('/')
    if (isRootRelative) p = p.slice(1)
    
    const isDirectory = p.endsWith('/')
    if (isDirectory) p = p.slice(0, -1)
    
    if (isDirectory) {
      patterns.push(`${p}/**`)
      if (!isRootRelative) {
        patterns.push(`**/${p}/**`)
        patterns.push(`**/${p}`)
      }
    } else if (p.includes('/')) {
      patterns.push(p)
      if (!isRootRelative) patterns.push(`**/${p}`)
    } else if (p.includes('*')) {
      patterns.push(p)
      patterns.push(`**/${p}`)
    } else {
      patterns.push(`**/${p}`)
      patterns.push(`**/${p}/**`)
      patterns.push(p)
    }
    
    return patterns
  }

  public static normalizePatterns = (patterns: string[]): string[] => {
    const normalized = new Set<string>()
    
    patterns.forEach(pattern => {
      let p = pattern.trim()
      if (!p) return
      
      if (p.startsWith('./')) p = p.slice(2)
      if (p.startsWith('/') && !p.startsWith('**')) p = p.slice(1)
      
      normalized.add(p)
    })
    
    return Array.from(normalized)
  }

  public static mergePatterns = (...patternGroups: (string[] | undefined)[]): string[] => {
    const allPatterns: string[] = []
    
    patternGroups.forEach(group => {
      if (group) allPatterns.push(...group)
    })
    
    return this.normalizePatterns(allPatterns)
  }

  public static addDefaultPatterns = (patterns: string[], outputPath?: string): string[] => {
    const defaults = [
      'node_modules',
      'node_modules/**',
      '**/node_modules',
      '**/node_modules/**',
      '.git',
      '.git/**',
      '**/.git',
      '**/.git/**',
      'codemerge.json',
      'codemerge.config.json'
    ]
    
    const combined = [...defaults, ...patterns]
    
    if (outputPath) {
      combined.push(outputPath)
      combined.push(`**/${outputPath}`)
    }
    
    return this.normalizePatterns(combined)
  }

  public static globToRegex = (glob: string): RegExp => {
    let regexStr = '^'
    let i = 0
    
    while (i < glob.length) {
      const char = glob[i]
      
      if (char === '*') {
        if (glob[i + 1] === '*' && glob[i + 2] === '/') {
          regexStr += '(?:.*/)?'
          i += 3
        } else if (glob[i + 1] === '*') {
          regexStr += '.*'
          i += 2
        } else {
          regexStr += '[^/]*'
          i += 1
        }
      } else if (char === '?') {
        regexStr += '[^/]'
        i += 1
      } else if ('./\\$^{}[]()+|'.includes(char)) {
        regexStr += `\\${char}`
        i += 1
      } else {
        regexStr += char
        i += 1
      }
    }
    
    return new RegExp(`${regexStr}$`)
  }
}