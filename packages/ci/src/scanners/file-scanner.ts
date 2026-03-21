import * as fs from 'node:fs';
import * as path from 'node:path';
import type { Finding, ScanConfig, RuleDefinition } from '../types.js';

/** Default scannable extensions */
const DEFAULT_EXTENSIONS = ['.ts', '.js', '.tsx', '.jsx', '.py', '.yml', '.yaml', '.json', '.env', '.cfg', '.conf', '.toml'];

/** Default directories to always ignore */
const DEFAULT_IGNORE_DIRS = [
  'node_modules',
  '.git',
  'dist',
  'build',
  'out',
  '.next',
  '.nuxt',
  '__pycache__',
  '.venv',
  'venv',
  '.tox',
  'coverage',
  '.nyc_output',
  '.cache',
];

/** Parse a .ranaignore file (gitignore-style) into patterns */
export function parseIgnoreFile(content: string): string[] {
  return content
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0 && !line.startsWith('#'));
}

/** Check if a relative path matches any ignore pattern */
export function matchesIgnorePattern(relativePath: string, patterns: string[]): boolean {
  for (const pattern of patterns) {
    // Direct file/dir name match
    if (relativePath === pattern) return true;

    // Check if any path segment matches the pattern
    const segments = relativePath.split('/');
    if (segments.some(seg => seg === pattern)) return true;

    // Glob-like pattern: *.ext
    if (pattern.startsWith('*.')) {
      const ext = pattern.slice(1); // e.g. ".log"
      if (relativePath.endsWith(ext)) return true;
    }

    // Directory pattern with trailing slash: dir/
    if (pattern.endsWith('/')) {
      const dirName = pattern.slice(0, -1);
      if (segments.some(seg => seg === dirName)) return true;
    }

    // Pattern with wildcard: src/**/test
    if (pattern.includes('*')) {
      const regexStr = pattern
        .replace(/\./g, '\\.')
        .replace(/\*\*/g, '{{GLOBSTAR}}')
        .replace(/\*/g, '[^/]*')
        .replace(/\{\{GLOBSTAR\}\}/g, '.*');
      const regex = new RegExp(`^${regexStr}$`);
      if (regex.test(relativePath)) return true;
    }
  }
  return false;
}

/** Recursively collect file paths under a root directory */
export function collectFiles(
  rootPath: string,
  extensions: string[],
  ignorePatterns: string[],
): string[] {
  const files: string[] = [];
  const absoluteRoot = path.resolve(rootPath);

  function walk(dir: string): void {
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return; // Skip unreadable directories
    }

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relativePath = path.relative(absoluteRoot, fullPath);

      if (entry.isDirectory()) {
        // Skip default ignored dirs
        if (DEFAULT_IGNORE_DIRS.includes(entry.name)) continue;
        // Skip user-ignored patterns
        if (matchesIgnorePattern(relativePath, ignorePatterns)) continue;
        walk(fullPath);
      } else if (entry.isFile()) {
        // Check extension
        const ext = path.extname(entry.name).toLowerCase();
        if (!extensions.includes(ext)) continue;
        // Check ignore patterns
        if (matchesIgnorePattern(relativePath, ignorePatterns)) continue;
        files.push(fullPath);
      }
    }
  }

  walk(absoluteRoot);
  return files;
}

/** Read file content safely */
export function readFileSafe(filePath: string): string | null {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    return null;
  }
}

/** Load .ranaignore patterns from a directory */
export function loadIgnorePatterns(rootPath: string): string[] {
  const ignorePath = path.join(rootPath, '.ranaignore');
  try {
    const content = fs.readFileSync(ignorePath, 'utf-8');
    return parseIgnoreFile(content);
  } catch {
    return [];
  }
}

export interface FileScanResult {
  findings: Finding[];
  filesScanned: number;
}

/**
 * Scan files in a directory using the provided rules.
 */
export function scanFiles(
  config: ScanConfig,
  rules: RuleDefinition[],
): FileScanResult {
  const rootPath = path.resolve(config.scanPath);

  // Load .ranaignore
  const ignorePatterns = [
    ...config.ignorePatterns,
    ...loadIgnorePatterns(rootPath),
  ];

  // Determine extensions from rules
  const extensionSet = new Set<string>();
  for (const rule of rules) {
    for (const ext of rule.fileExtensions) {
      extensionSet.add(ext);
    }
  }
  const extensions = extensionSet.size > 0
    ? Array.from(extensionSet)
    : DEFAULT_EXTENSIONS;

  // Collect files
  const files = collectFiles(rootPath, extensions, ignorePatterns);

  const allFindings: Finding[] = [];

  for (const filePath of files) {
    const content = readFileSafe(filePath);
    if (content === null) continue;

    // Make path relative for findings
    const relativePath = path.relative(rootPath, filePath);
    const ext = path.extname(filePath).toLowerCase();

    for (const rule of rules) {
      // Only run rule if it applies to this file extension
      if (!rule.fileExtensions.includes(ext)) continue;

      const result = rule.run(relativePath, content, config);
      allFindings.push(...result.findings);
    }
  }

  return {
    findings: allFindings,
    filesScanned: files.length,
  };
}
