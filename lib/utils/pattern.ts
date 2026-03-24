export class PatternUtils {
  public static parseGitignorePatterns(content: string): string[] {
    const patterns: string[] = [];
    
    content.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      if (trimmed.startsWith('!')) return;
      
      const converted = this.convertGitignorePattern(trimmed);
      patterns.push(...converted);
    });

    return patterns;
  }

  private static convertGitignorePattern(pattern: string): string[] {
    const patterns: string[] = [];
    let p = pattern;
    
    const isRootRelative = p.startsWith('/');
    if (isRootRelative) p = p.slice(1);
    
    const isDirectory = p.endsWith('/');
    if (isDirectory) p = p.slice(0, -1);
    
    if (isDirectory) {
      patterns.push(`${p}/**`);
      if (!isRootRelative) {
        patterns.push(`**/${p}/**`);
        patterns.push(`**/${p}`);
      }
    } else if (p.includes('/')) {
      patterns.push(p);
      if (!isRootRelative) patterns.push(`**/${p}`);
    } else if (p.includes('*')) {
      patterns.push(p);
      patterns.push(`**/${p}`);
    } else {
      patterns.push(`**/${p}`);
      patterns.push(`**/${p}/**`);
      patterns.push(p);
    }

    return patterns;
  }

  public static normalizePatterns(patterns: string[]): string[] {
    const normalized = new Set<string>();
    
    patterns.forEach(pattern => {
      let p = pattern.trim();
      if (!p) return;
      
      if (p.startsWith('./')) p = p.slice(2);
      if (p.startsWith('/') && !p.startsWith('**')) p = p.slice(1);
      
      normalized.add(p);
    });

    return Array.from(normalized);
  }

  public static mergePatterns(...patternGroups: (string[] | undefined)[]): string[] {
    const allPatterns: string[] = [];
    
    patternGroups.forEach(group => {
      if (group) allPatterns.push(...group);
    });

    return this.normalizePatterns(allPatterns);
  }

  public static addDefaultPatterns(patterns: string[], outputPath?: string): string[] {
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
    ];

    const combined = [...defaults, ...patterns];

    if (outputPath) {
      combined.push(outputPath);
      combined.push(`**/${outputPath}`);
    }

    return this.normalizePatterns(combined);
  }
}