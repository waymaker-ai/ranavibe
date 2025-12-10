import * as fs from 'fs/promises';
import * as path from 'path';
import {
  CodebaseContext,
  PackageInfo,
  FileTree,
  Component,
  ComponentProp,
  StyleGuide,
  CodePattern,
  Framework,
  TestingFramework,
  StateManagement,
} from '../types';

// ============================================================================
// Context Analyzer - Analyzes existing codebase to understand patterns
// ============================================================================

export interface AnalyzerConfig {
  maxDepth?: number;
  maxFiles?: number;
  ignorePaths?: string[];
}

const DEFAULT_IGNORE = [
  'node_modules',
  '.git',
  '.next',
  'dist',
  'build',
  'coverage',
  '.turbo',
  '.vercel',
  '__pycache__',
  '.cache',
];

export class ContextAnalyzer {
  private config: AnalyzerConfig;

  constructor(config: AnalyzerConfig = {}) {
    this.config = {
      maxDepth: 5,
      maxFiles: 500,
      ignorePaths: DEFAULT_IGNORE,
      ...config,
    };
  }

  /**
   * Analyze the entire codebase
   */
  async analyze(rootPath: string): Promise<CodebaseContext> {
    const [
      framework,
      dependencies,
      fileStructure,
      existingComponents,
      styleGuide,
      patterns,
      testingFramework,
      stateManagement,
    ] = await Promise.all([
      this.detectFramework(rootPath),
      this.analyzeDependencies(rootPath),
      this.scanFileStructure(rootPath),
      this.extractComponents(rootPath),
      this.inferStyleGuide(rootPath),
      this.detectPatterns(rootPath),
      this.detectTestingFramework(rootPath),
      this.detectStateManagement(rootPath),
    ]);

    return {
      framework,
      dependencies,
      fileStructure,
      existingComponents,
      styleGuide,
      patterns,
      testingFramework,
      stateManagement,
    };
  }

  /**
   * Detect the framework being used
   */
  async detectFramework(rootPath: string): Promise<Framework> {
    try {
      const packageJsonPath = path.join(rootPath, 'package.json');
      const content = await fs.readFile(packageJsonPath, 'utf-8');
      const pkg = JSON.parse(content);

      const deps = {
        ...pkg.dependencies,
        ...pkg.devDependencies,
      };

      // Check for specific frameworks
      if (deps['next']) return 'next';
      if (deps['react'] && !deps['next']) return 'react';
      if (deps['express']) return 'express';
      if (deps['fastify']) return 'fastify';
      if (deps['@types/node'] || pkg.main) return 'node';

      return 'unknown';
    } catch {
      return 'unknown';
    }
  }

  /**
   * Analyze package.json dependencies
   */
  async analyzeDependencies(rootPath: string): Promise<PackageInfo[]> {
    try {
      const packageJsonPath = path.join(rootPath, 'package.json');
      const content = await fs.readFile(packageJsonPath, 'utf-8');
      const pkg = JSON.parse(content);

      const dependencies: PackageInfo[] = [];

      for (const [name, version] of Object.entries(pkg.dependencies || {})) {
        dependencies.push({
          name,
          version: version as string,
          type: 'dependency',
        });
      }

      for (const [name, version] of Object.entries(pkg.devDependencies || {})) {
        dependencies.push({
          name,
          version: version as string,
          type: 'devDependency',
        });
      }

      return dependencies;
    } catch {
      return [];
    }
  }

  /**
   * Scan file structure recursively
   */
  async scanFileStructure(rootPath: string, depth = 0): Promise<FileTree> {
    const name = path.basename(rootPath);

    if (depth > this.config.maxDepth!) {
      return { name, path: rootPath, type: 'directory', children: [] };
    }

    try {
      const stat = await fs.stat(rootPath);

      if (!stat.isDirectory()) {
        return { name, path: rootPath, type: 'file' };
      }

      const entries = await fs.readdir(rootPath);
      const children: FileTree[] = [];

      for (const entry of entries) {
        if (this.config.ignorePaths!.includes(entry)) continue;
        if (entry.startsWith('.') && entry !== '.env.example') continue;

        const childPath = path.join(rootPath, entry);
        const childTree = await this.scanFileStructure(childPath, depth + 1);
        children.push(childTree);
      }

      return { name, path: rootPath, type: 'directory', children };
    } catch {
      return { name, path: rootPath, type: 'file' };
    }
  }

  /**
   * Extract React/Vue components from codebase
   */
  async extractComponents(rootPath: string): Promise<Component[]> {
    const components: Component[] = [];
    const componentFiles = await this.findFiles(rootPath, /\.(tsx|jsx)$/);

    for (const filePath of componentFiles.slice(0, 50)) {
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        const component = this.parseComponent(content, filePath);
        if (component) {
          components.push(component);
        }
      } catch {
        continue;
      }
    }

    return components;
  }

  /**
   * Parse a component file to extract metadata
   */
  private parseComponent(content: string, filePath: string): Component | null {
    // Extract component name
    const nameMatch = content.match(
      /(?:export\s+(?:default\s+)?)?(?:function|const)\s+(\w+)/
    ) || content.match(/class\s+(\w+)/);

    if (!nameMatch) return null;

    const name = nameMatch[1];

    // Extract props interface
    const propsMatch = content.match(
      /interface\s+\w*Props\s*\{([^}]+)\}/
    ) || content.match(
      /type\s+\w*Props\s*=\s*\{([^}]+)\}/
    );

    const props: ComponentProp[] = [];
    if (propsMatch) {
      const propsContent = propsMatch[1];
      const propMatches = propsContent.matchAll(/(\w+)(\?)?:\s*([^;,\n]+)/g);
      for (const match of propMatches) {
        props.push({
          name: match[1],
          type: match[3].trim(),
          required: !match[2],
        });
      }
    }

    // Extract imports
    const imports: string[] = [];
    const importMatches = content.matchAll(/import\s+(?:.*?)\s+from\s+['"]([^'"]+)['"]/g);
    for (const match of importMatches) {
      imports.push(match[1]);
    }

    // Extract exports
    const exports: string[] = [];
    const exportMatches = content.matchAll(/export\s+(?:default\s+)?(?:const|function|class)\s+(\w+)/g);
    for (const match of exportMatches) {
      exports.push(match[1]);
    }

    // Detect patterns
    const patterns: string[] = [];
    if (content.includes('useState')) patterns.push('useState');
    if (content.includes('useEffect')) patterns.push('useEffect');
    if (content.includes('useContext')) patterns.push('useContext');
    if (content.includes('useMemo')) patterns.push('useMemo');
    if (content.includes('useCallback')) patterns.push('useCallback');
    if (content.includes('useQuery')) patterns.push('react-query');
    if (content.includes('useForm')) patterns.push('react-hook-form');

    return {
      name,
      path: filePath,
      props,
      exports,
      imports,
      patterns,
    };
  }

  /**
   * Infer code style from existing files
   */
  async inferStyleGuide(rootPath: string): Promise<StyleGuide> {
    const files = await this.findFiles(rootPath, /\.(ts|tsx|js|jsx)$/);
    const sampleFiles = files.slice(0, 20);

    let usesSpaces = 0;
    let usesTabs = 0;
    let usesSingleQuotes = 0;
    let usesDoubleQuotes = 0;
    let usesSemicolons = 0;
    let noSemicolons = 0;
    let usesFunctionComponents = 0;
    let usesArrowComponents = 0;

    for (const filePath of sampleFiles) {
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        const lines = content.split('\n');

        for (const line of lines.slice(0, 50)) {
          // Check indentation
          if (line.startsWith('\t')) usesTabs++;
          else if (line.startsWith('  ')) usesSpaces++;

          // Check quotes
          if (line.includes("'")) usesSingleQuotes++;
          if (line.includes('"')) usesDoubleQuotes++;

          // Check semicolons (at end of statements)
          if (/;\s*$/.test(line)) usesSemicolons++;
          else if (/[^{}\s]\s*$/.test(line) && !line.includes('//')) noSemicolons++;
        }

        // Check component style
        if (/function\s+\w+\s*\(/.test(content)) usesFunctionComponents++;
        if (/const\s+\w+\s*=\s*\(/.test(content)) usesArrowComponents++;
      } catch {
        continue;
      }
    }

    return {
      indentation: usesTabs > usesSpaces ? 'tabs' : 'spaces',
      indentSize: 2,
      quotes: usesSingleQuotes > usesDoubleQuotes ? 'single' : 'double',
      semicolons: usesSemicolons > noSemicolons,
      trailingCommas: 'es5',
      componentStyle: usesFunctionComponents > usesArrowComponents ? 'function' : 'arrow',
      namingConvention: 'camelCase',
      importStyle: 'named',
    };
  }

  /**
   * Detect common code patterns
   */
  async detectPatterns(rootPath: string): Promise<CodePattern[]> {
    const patterns: CodePattern[] = [];
    const files = await this.findFiles(rootPath, /\.(ts|tsx|js|jsx)$/);

    const patternChecks = [
      {
        name: 'Custom Hooks',
        type: 'hook' as const,
        pattern: /export\s+function\s+use\w+/,
        description: 'Custom React hooks for reusable logic',
      },
      {
        name: 'API Route Handlers',
        type: 'api' as const,
        pattern: /export\s+(?:async\s+)?function\s+(?:GET|POST|PUT|DELETE|PATCH)/,
        description: 'Next.js App Router API handlers',
      },
      {
        name: 'Server Components',
        type: 'component' as const,
        pattern: /async\s+function\s+\w+Page/,
        description: 'React Server Components',
      },
      {
        name: 'Client Components',
        type: 'component' as const,
        pattern: /['"]use client['"]/,
        description: 'React Client Components',
      },
      {
        name: 'Utility Functions',
        type: 'utility' as const,
        pattern: /export\s+(?:const|function)\s+[a-z]\w+\s*=/,
        description: 'Utility/helper functions',
      },
      {
        name: 'Test Files',
        type: 'test' as const,
        pattern: /describe\s*\(|test\s*\(|it\s*\(/,
        description: 'Test suites',
      },
    ];

    for (const filePath of files.slice(0, 100)) {
      try {
        const content = await fs.readFile(filePath, 'utf-8');

        for (const check of patternChecks) {
          if (check.pattern.test(content) && !patterns.some(p => p.name === check.name)) {
            const example = content.match(check.pattern)?.[0] || '';
            patterns.push({
              name: check.name,
              type: check.type,
              description: check.description,
              example: example.slice(0, 100),
            });
          }
        }
      } catch {
        continue;
      }
    }

    return patterns;
  }

  /**
   * Detect testing framework
   */
  async detectTestingFramework(rootPath: string): Promise<TestingFramework> {
    try {
      const packageJsonPath = path.join(rootPath, 'package.json');
      const content = await fs.readFile(packageJsonPath, 'utf-8');
      const pkg = JSON.parse(content);

      const deps = {
        ...pkg.dependencies,
        ...pkg.devDependencies,
      };

      if (deps['vitest']) return 'vitest';
      if (deps['jest']) return 'jest';
      if (deps['mocha']) return 'mocha';
      if (deps['playwright']) return 'playwright';
      if (deps['cypress']) return 'cypress';

      return 'unknown';
    } catch {
      return 'unknown';
    }
  }

  /**
   * Detect state management solution
   */
  async detectStateManagement(rootPath: string): Promise<StateManagement> {
    try {
      const packageJsonPath = path.join(rootPath, 'package.json');
      const content = await fs.readFile(packageJsonPath, 'utf-8');
      const pkg = JSON.parse(content);

      const deps = {
        ...pkg.dependencies,
        ...pkg.devDependencies,
      };

      if (deps['@reduxjs/toolkit'] || deps['redux']) return 'redux';
      if (deps['zustand']) return 'zustand';
      if (deps['jotai']) return 'jotai';
      if (deps['recoil']) return 'recoil';

      // Check for Context usage in files
      const files = await this.findFiles(rootPath, /\.(tsx|jsx)$/);
      for (const filePath of files.slice(0, 20)) {
        const fileContent = await fs.readFile(filePath, 'utf-8');
        if (fileContent.includes('createContext') || fileContent.includes('useContext')) {
          return 'context';
        }
      }

      return 'none';
    } catch {
      return 'unknown';
    }
  }

  /**
   * Find files matching a pattern
   */
  private async findFiles(rootPath: string, pattern: RegExp, depth = 0): Promise<string[]> {
    const files: string[] = [];

    if (depth > this.config.maxDepth! || files.length >= this.config.maxFiles!) {
      return files;
    }

    try {
      const entries = await fs.readdir(rootPath, { withFileTypes: true });

      for (const entry of entries) {
        if (this.config.ignorePaths!.includes(entry.name)) continue;
        if (entry.name.startsWith('.')) continue;

        const fullPath = path.join(rootPath, entry.name);

        if (entry.isDirectory()) {
          const subFiles = await this.findFiles(fullPath, pattern, depth + 1);
          files.push(...subFiles);
        } else if (entry.isFile() && pattern.test(entry.name)) {
          files.push(fullPath);
        }

        if (files.length >= this.config.maxFiles!) break;
      }
    } catch {
      // Ignore permission errors
    }

    return files;
  }

  /**
   * Get a quick summary of the codebase
   */
  async getSummary(rootPath: string): Promise<string> {
    const context = await this.analyze(rootPath);

    return `
Framework: ${context.framework}
Dependencies: ${context.dependencies.length} packages
Components: ${context.existingComponents.length} found
Testing: ${context.testingFramework}
State Management: ${context.stateManagement}
Style: ${context.styleGuide.indentation}, ${context.styleGuide.quotes} quotes, ${context.styleGuide.semicolons ? 'semicolons' : 'no semicolons'}
Patterns: ${context.patterns.map(p => p.name).join(', ')}
    `.trim();
  }
}

// Export singleton instance
export const contextAnalyzer = new ContextAnalyzer();
