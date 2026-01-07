import * as path from 'path';
import {
  GeneratedFile,
  CodebaseContext,
  FilePlacement,
  FileModification,
  FileConflict,
  IntegrationResult,
  Framework,
} from '../types';

/**
 * Smart File Placement and Import Management
 * Determines where files should go and manages imports/exports
 */

export interface FileIntegratorConfig {
  framework?: Framework;
  preferredDirs?: {
    components?: string;
    pages?: string;
    api?: string;
    lib?: string;
    hooks?: string;
    types?: string;
    utils?: string;
  };
  autoImport?: boolean;
  autoExport?: boolean;
  resolveConflicts?: 'ask' | 'rename' | 'overwrite' | 'skip';
}

export class FileIntegrator {
  private config: FileIntegratorConfig;
  private context?: CodebaseContext;

  constructor(config: FileIntegratorConfig = {}) {
    this.config = {
      autoImport: true,
      autoExport: true,
      resolveConflicts: 'ask',
      ...config,
    };
  }

  /**
   * Integrate generated files into existing codebase
   */
  async integrate(
    files: GeneratedFile[],
    context: CodebaseContext
  ): Promise<IntegrationResult> {
    this.context = context;
    this.config.framework = context.framework;

    const placements: FilePlacement[] = [];
    const conflicts: FileConflict[] = [];
    const suggestions: string[] = [];

    for (const file of files) {
      const placement = await this.determinePlacement(file, context);
      placements.push(placement);

      // Check for conflicts
      const conflict = await this.detectConflict(placement, context);
      if (conflict) {
        conflicts.push(conflict);
      }

      // Generate modification suggestions
      const mods = this.generateModifications(placement, context);
      placement.modifications.push(...mods);
    }

    // Add cross-file suggestions
    suggestions.push(...this.generateSuggestions(placements, context));

    return {
      placements,
      conflicts,
      suggestions,
    };
  }

  /**
   * Determine where a file should be placed
   */
  private async determinePlacement(
    file: GeneratedFile,
    context: CodebaseContext
  ): Promise<FilePlacement> {
    const suggestedPath = this.suggestFilePath(file, context);
    const imports = this.extractImports(file);
    const exports = this.extractExports(file);

    return {
      file,
      path: suggestedPath,
      imports,
      exports,
      modifications: [],
    };
  }

  /**
   * Suggest optimal file path based on type and framework
   */
  private suggestFilePath(
    file: GeneratedFile,
    context: CodebaseContext
  ): string {
    const framework = this.config.framework || context.framework;

    // Extract base filename
    const fileName = file.path.split('/').pop() || 'file.ts';

    switch (file.type) {
      case 'component':
        return this.getComponentPath(fileName, framework);

      case 'api':
        return this.getAPIPath(fileName, framework);

      case 'schema':
        return this.getSchemaPath(fileName, framework);

      case 'util':
        return this.getUtilPath(fileName, framework);

      case 'test':
        return this.getTestPath(fileName, framework);

      case 'config':
        return this.getConfigPath(fileName);

      default:
        return path.join('src', file.path);
    }
  }

  /**
   * Get component file path
   */
  private getComponentPath(fileName: string, framework: Framework): string {
    const baseDir = this.config.preferredDirs?.components;

    if (framework === 'next') {
      // Next.js: components go in /components or /app/components
      if (baseDir) return path.join(baseDir, fileName);

      // Check if it's a page component
      if (fileName.includes('page.tsx') || fileName.includes('Page.tsx')) {
        return path.join('app', fileName);
      }

      // Check if it's a layout
      if (fileName.includes('layout.tsx') || fileName.includes('Layout.tsx')) {
        return path.join('app', fileName);
      }

      return path.join('components', fileName);
    }

    if (framework === 'react') {
      return path.join('src', 'components', fileName);
    }

    return path.join('src', 'components', fileName);
  }

  /**
   * Get API file path
   */
  private getAPIPath(fileName: string, framework: Framework): string {
    const baseDir = this.config.preferredDirs?.api;

    if (framework === 'next') {
      // Next.js App Router: /app/api/...
      if (baseDir) return path.join(baseDir, fileName);
      return path.join('app', 'api', fileName);
    }

    if (framework === 'express' || framework === 'fastify') {
      // Express/Fastify: /src/routes/...
      return path.join('src', 'routes', fileName);
    }

    return path.join('src', 'api', fileName);
  }

  /**
   * Get schema file path
   */
  private getSchemaPath(fileName: string, framework: Framework): string {
    // Prisma schemas go in /prisma/schema.prisma
    if (fileName.includes('schema.prisma')) {
      return path.join('prisma', 'schema.prisma');
    }

    // Drizzle schemas go in /src/db/schema.ts
    if (fileName.includes('drizzle')) {
      return path.join('src', 'db', 'schema.ts');
    }

    // SQL migrations go in /prisma/migrations or /migrations
    if (fileName.endsWith('.sql')) {
      const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
      const migrationName = fileName.replace('.sql', '');
      return path.join('prisma', 'migrations', `${timestamp}_${migrationName}`, 'migration.sql');
    }

    return path.join('src', 'schema', fileName);
  }

  /**
   * Get utility file path
   */
  private getUtilPath(fileName: string, framework: Framework): string {
    const baseDir = this.config.preferredDirs?.utils;

    // Check if it's a custom hook
    if (fileName.startsWith('use') && fileName.endsWith('.ts')) {
      const hooksDir = this.config.preferredDirs?.hooks;
      if (hooksDir) return path.join(hooksDir, fileName);
      return path.join('src', 'hooks', fileName);
    }

    // Check if it's a type definition
    if (fileName.endsWith('.types.ts') || fileName.endsWith('.d.ts')) {
      const typesDir = this.config.preferredDirs?.types;
      if (typesDir) return path.join(typesDir, fileName);
      return path.join('src', 'types', fileName);
    }

    if (baseDir) return path.join(baseDir, fileName);
    return path.join('src', 'lib', fileName);
  }

  /**
   * Get test file path
   */
  private getTestPath(fileName: string, framework: Framework): string {
    // Tests usually go next to the file they're testing
    // or in a __tests__ directory
    const sourceFile = fileName.replace(/\.(test|spec)\.(ts|tsx|js|jsx)$/, '.$2');
    const sourcePath = this.suggestFilePath(
      { path: sourceFile, content: '', type: 'util', language: 'typescript' },
      this.context!
    );

    const dir = path.dirname(sourcePath);
    return path.join(dir, fileName);
  }

  /**
   * Get config file path
   */
  private getConfigPath(fileName: string): string {
    // Config files usually go in root
    return fileName;
  }

  /**
   * Extract imports from file content
   */
  private extractImports(file: GeneratedFile): string[] {
    const imports: string[] = [];
    const importRegex = /import\s+(?:.*?)\s+from\s+['"]([^'"]+)['"]/g;

    let match;
    while ((match = importRegex.exec(file.content)) !== null) {
      imports.push(match[1]);
    }

    return imports;
  }

  /**
   * Extract exports from file content
   */
  private extractExports(file: GeneratedFile): string[] {
    const exports: string[] = [];

    // Named exports
    const namedExportRegex = /export\s+(?:const|function|class|interface|type|enum)\s+(\w+)/g;
    let match;
    while ((match = namedExportRegex.exec(file.content)) !== null) {
      exports.push(match[1]);
    }

    // Default export
    if (/export\s+default/.test(file.content)) {
      const defaultMatch = file.content.match(/export\s+default\s+(?:const|function|class)?\s*(\w+)/);
      if (defaultMatch) {
        exports.push(`default as ${defaultMatch[1]}`);
      } else {
        exports.push('default');
      }
    }

    return exports;
  }

  /**
   * Detect conflicts with existing files
   */
  private async detectConflict(
    placement: FilePlacement,
    context: CodebaseContext
  ): Promise<FileConflict | null> {
    // Check if file already exists
    const exists = this.fileExists(placement.path, context);

    if (exists) {
      return {
        path: placement.path,
        type: 'exists',
        resolution: this.config.resolveConflicts || 'ask',
        message: `File ${placement.path} already exists`,
      };
    }

    // Check for naming conflicts (different path, same export name)
    const exportConflicts = this.detectExportConflicts(placement, context);
    if (exportConflicts.length > 0) {
      return {
        path: placement.path,
        type: 'naming',
        resolution: 'rename',
        message: `Export names conflict with existing exports: ${exportConflicts.join(', ')}`,
      };
    }

    return null;
  }

  /**
   * Check if file exists in codebase
   */
  private fileExists(filePath: string, context: CodebaseContext): boolean {
    // Recursively search file tree
    const search = (tree: any): boolean => {
      if (tree.path === filePath) return true;
      if (tree.children) {
        return tree.children.some((child: any) => search(child));
      }
      return false;
    };

    return search(context.fileStructure);
  }

  /**
   * Detect export naming conflicts
   */
  private detectExportConflicts(
    placement: FilePlacement,
    context: CodebaseContext
  ): string[] {
    const conflicts: string[] = [];
    const newExports = new Set(placement.exports);

    // Check against existing components
    for (const component of context.existingComponents) {
      for (const exportName of component.exports) {
        if (newExports.has(exportName)) {
          conflicts.push(exportName);
        }
      }
    }

    return conflicts;
  }

  /**
   * Generate file modifications (imports, exports, config updates)
   */
  private generateModifications(
    placement: FilePlacement,
    context: CodebaseContext
  ): FileModification[] {
    const modifications: FileModification[] = [];

    if (!this.config.autoImport && !this.config.autoExport) {
      return modifications;
    }

    // Auto-add to barrel exports (index.ts)
    if (this.config.autoExport && placement.exports.length > 0) {
      const barrelMod = this.generateBarrelExport(placement);
      if (barrelMod) modifications.push(barrelMod);
    }

    // Update route configuration for pages
    if (placement.file.type === 'component' && this.isPageComponent(placement.file)) {
      const routeMod = this.generateRouteConfig(placement);
      if (routeMod) modifications.push(routeMod);
    }

    // Update API router for API endpoints
    if (placement.file.type === 'api') {
      const apiMod = this.generateAPIRouterUpdate(placement);
      if (apiMod) modifications.push(apiMod);
    }

    return modifications;
  }

  /**
   * Generate barrel export modification
   */
  private generateBarrelExport(placement: FilePlacement): FileModification | null {
    const dir = path.dirname(placement.path);
    const indexPath = path.join(dir, 'index.ts');
    const relativePath = './' + path.basename(placement.path, path.extname(placement.path));

    const exports = placement.exports
      .filter(e => !e.includes('default'))
      .map(e => e.split(' ')[0]); // Remove 'default as X' part

    if (exports.length === 0 && !placement.exports.some(e => e.includes('default'))) {
      return null;
    }

    let content = '';

    if (placement.exports.some(e => e.includes('default'))) {
      const defaultName = placement.exports.find(e => e.includes('default'))?.split(' as ')[1];
      if (defaultName) {
        content += `export { default as ${defaultName} } from '${relativePath}';\n`;
      }
    }

    if (exports.length > 0) {
      content += `export { ${exports.join(', ')} } from '${relativePath}';\n`;
    }

    return {
      file: indexPath,
      type: 'add-export',
      content,
      location: 'end',
    };
  }

  /**
   * Check if file is a page component
   */
  private isPageComponent(file: GeneratedFile): boolean {
    return file.path.includes('page.tsx') ||
           file.path.includes('Page.tsx') ||
           file.content.includes('export default') && file.content.includes('Page');
  }

  /**
   * Generate route configuration update
   */
  private generateRouteConfig(placement: FilePlacement): FileModification | null {
    // This would update a routes.ts file with the new route
    // Implementation depends on routing library (react-router, next, etc.)
    return null; // Simplified for now
  }

  /**
   * Generate API router update
   */
  private generateAPIRouterUpdate(placement: FilePlacement): FileModification | null {
    // This would update the main API router to include the new endpoint
    return null; // Simplified for now
  }

  /**
   * Generate integration suggestions
   */
  private generateSuggestions(
    placements: FilePlacement[],
    context: CodebaseContext
  ): string[] {
    const suggestions: string[] = [];

    // Check for missing dependencies
    const allImports = new Set<string>();
    placements.forEach(p => p.imports.forEach(i => allImports.add(i)));

    const externalImports = Array.from(allImports).filter(
      imp => !imp.startsWith('.') && !imp.startsWith('@/')
    );

    const missingDeps = externalImports.filter(
      imp => !context.dependencies.some(d => imp.startsWith(d.name))
    );

    if (missingDeps.length > 0) {
      suggestions.push(
        `Install missing dependencies: npm install ${missingDeps.join(' ')}`
      );
    }

    // Check for style/pattern consistency
    const hasClientComponents = placements.some(
      p => p.file.content.includes("'use client'")
    );

    if (hasClientComponents && context.framework === 'next') {
      suggestions.push(
        'Some components use client-side features. Ensure server/client boundaries are correct.'
      );
    }

    // Check for testing gaps
    const hasTests = placements.some(p => p.file.type === 'test');
    const hasComponents = placements.some(p => p.file.type === 'component');

    if (hasComponents && !hasTests) {
      suggestions.push(
        'Consider adding tests for the generated components.'
      );
    }

    return suggestions;
  }

  /**
   * Apply smart import fixes
   */
  static fixImports(file: GeneratedFile, context: CodebaseContext): GeneratedFile {
    let content = file.content;

    // Convert relative imports to use path aliases if configured
    if (context.fileStructure) {
      content = content.replace(
        /from ['"]\.\.\/\.\.\/\.\.\/(.+)['"]/g,
        "from '@/$1'"
      );
    }

    // Sort imports
    content = this.sortImports(content);

    // Remove duplicate imports
    content = this.deduplicateImports(content);

    return {
      ...file,
      content,
    };
  }

  /**
   * Sort imports (external first, then internal)
   */
  private static sortImports(content: string): string {
    const lines = content.split('\n');
    const imports: string[] = [];
    const nonImports: string[] = [];

    let inImportBlock = false;

    for (const line of lines) {
      if (line.startsWith('import ')) {
        imports.push(line);
        inImportBlock = true;
      } else if (inImportBlock && line.trim() === '') {
        // Empty line after imports
        inImportBlock = false;
        nonImports.push(line);
      } else {
        inImportBlock = false;
        nonImports.push(line);
      }
    }

    if (imports.length === 0) return content;

    // Separate external and internal imports
    const externalImports = imports.filter(imp => !imp.includes("from '.") && !imp.includes('from "@/'));
    const internalImports = imports.filter(imp => imp.includes("from '.") || imp.includes('from "@/'));

    // Sort alphabetically
    externalImports.sort();
    internalImports.sort();

    const sortedImports = [...externalImports, '', ...internalImports];

    return [...sortedImports, '', ...nonImports].join('\n');
  }

  /**
   * Remove duplicate imports
   */
  private static deduplicateImports(content: string): string {
    const lines = content.split('\n');
    const seen = new Set<string>();
    const result: string[] = [];

    for (const line of lines) {
      if (line.startsWith('import ')) {
        if (!seen.has(line)) {
          seen.add(line);
          result.push(line);
        }
      } else {
        result.push(line);
      }
    }

    return result.join('\n');
  }
}
