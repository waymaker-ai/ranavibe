/**
 * Code Chunker
 * Chunk code while preserving function and class boundaries
 */

import type { Chunk, Chunker, CodeChunkerOptions } from '../types';

interface Declaration {
  type: string;
  name: string;
  text: string;
  startLine: number;
  endLine: number;
  children?: Declaration[];
}

export class CodeChunker implements Chunker {
  /**
   * Chunk code while preserving function/class boundaries
   */
  async chunk(code: string, options: CodeChunkerOptions): Promise<Chunk[]> {
    const {
      language = 'typescript',
      chunkSize = 1024,
      overlap = 0,
      preserveFunctions = true,
      preserveClasses = true,
      includeComments = true,
      minChunkSize = 50,
      maxChunkSize = 4000,
    } = options;

    // 1. Parse code into declarations
    const declarations = this.parseCode(code, language as string);

    // 2. Create chunks from declarations
    const chunks: Chunk[] = [];

    for (const decl of declarations) {
      // If declaration fits in a chunk, add it
      if (decl.text.length <= maxChunkSize) {
        chunks.push(this.createChunk(decl, chunks.length, language as string));
      } else {
        // Split large declarations
        const subChunks = this.splitLargeDeclaration(decl, {
          chunkSize,
          maxChunkSize,
          minChunkSize,
          language: language as string,
        });
        chunks.push(...subChunks);
      }
    }

    // 3. If no declarations found, fall back to line-based chunking
    if (chunks.length === 0) {
      return this.lineBasedChunking(code, {
        chunkSize,
        overlap,
        minChunkSize,
        maxChunkSize,
        language: language as string,
      });
    }

    return chunks;
  }

  /**
   * Parse code into declarations (functions, classes, etc.)
   */
  private parseCode(code: string, language: string): Declaration[] {
    const lines = code.split('\n');
    const declarations: Declaration[] = [];

    switch (language.toLowerCase()) {
      case 'typescript':
      case 'javascript':
      case 'ts':
      case 'js':
        return this.parseJavaScriptLike(lines);
      case 'python':
      case 'py':
        return this.parsePython(lines);
      case 'go':
        return this.parseGo(lines);
      case 'rust':
        return this.parseRust(lines);
      default:
        // Generic parsing using brace matching
        return this.parseGeneric(lines);
    }

    return declarations;
  }

  /**
   * Parse JavaScript/TypeScript code
   */
  private parseJavaScriptLike(lines: string[]): Declaration[] {
    const declarations: Declaration[] = [];
    let currentDecl: Declaration | null = null;
    let braceCount = 0;
    let startLine = 0;
    let buffer: string[] = [];

    const patterns = {
      function: /^(?:export\s+)?(?:async\s+)?function\s+(\w+)/,
      arrowFunction: /^(?:export\s+)?(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>/,
      class: /^(?:export\s+)?(?:abstract\s+)?class\s+(\w+)/,
      interface: /^(?:export\s+)?interface\s+(\w+)/,
      type: /^(?:export\s+)?type\s+(\w+)/,
      method: /^\s+(?:async\s+)?(\w+)\s*\([^)]*\)\s*[:{]/,
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Skip empty lines and comments at top level
      if (!currentDecl && (trimmed === '' || trimmed.startsWith('//'))) {
        continue;
      }

      // Check for declaration start
      if (!currentDecl) {
        let match: RegExpMatchArray | null = null;
        let type = '';

        for (const [declType, pattern] of Object.entries(patterns)) {
          match = trimmed.match(pattern);
          if (match) {
            type = declType;
            break;
          }
        }

        if (match) {
          currentDecl = {
            type,
            name: match[1],
            text: '',
            startLine: i,
            endLine: i,
          };
          startLine = i;
          buffer = [];
          braceCount = 0;
        }
      }

      if (currentDecl) {
        buffer.push(line);

        // Count braces
        for (const char of line) {
          if (char === '{') braceCount++;
          if (char === '}') braceCount--;
        }

        // Check if declaration is complete
        if (braceCount === 0 && buffer.length > 0 && line.includes('}')) {
          currentDecl.text = buffer.join('\n');
          currentDecl.endLine = i;
          declarations.push(currentDecl);
          currentDecl = null;
        }

        // Handle single-line type/interface
        if (currentDecl &&
            (currentDecl.type === 'type' || currentDecl.type === 'interface') &&
            line.includes(';') &&
            braceCount === 0) {
          currentDecl.text = buffer.join('\n');
          currentDecl.endLine = i;
          declarations.push(currentDecl);
          currentDecl = null;
        }
      }
    }

    // Handle unclosed declaration
    if (currentDecl && buffer.length > 0) {
      currentDecl.text = buffer.join('\n');
      currentDecl.endLine = lines.length - 1;
      declarations.push(currentDecl);
    }

    return declarations;
  }

  /**
   * Parse Python code
   */
  private parsePython(lines: string[]): Declaration[] {
    const declarations: Declaration[] = [];
    let currentDecl: Declaration | null = null;
    let currentIndent = 0;
    let buffer: string[] = [];

    const patterns = {
      function: /^def\s+(\w+)\s*\(/,
      asyncFunction: /^async\s+def\s+(\w+)\s*\(/,
      class: /^class\s+(\w+)/,
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      const indent = line.length - line.trimStart().length;

      // Skip empty lines and comments at top level
      if (!currentDecl && (trimmed === '' || trimmed.startsWith('#'))) {
        continue;
      }

      // Check for declaration start at top level
      if (!currentDecl && indent === 0) {
        let match: RegExpMatchArray | null = null;
        let type = '';

        for (const [declType, pattern] of Object.entries(patterns)) {
          match = trimmed.match(pattern);
          if (match) {
            type = declType;
            break;
          }
        }

        if (match) {
          currentDecl = {
            type,
            name: match[1],
            text: '',
            startLine: i,
            endLine: i,
          };
          currentIndent = indent;
          buffer = [line];
          continue;
        }
      }

      if (currentDecl) {
        // Check if we've left the declaration (back to original indent level)
        if (trimmed !== '' && indent <= currentIndent && i > currentDecl.startLine) {
          currentDecl.text = buffer.join('\n');
          currentDecl.endLine = i - 1;
          declarations.push(currentDecl);
          currentDecl = null;

          // Re-check this line for new declaration
          i--;
          continue;
        }

        buffer.push(line);
      }
    }

    // Handle final declaration
    if (currentDecl && buffer.length > 0) {
      currentDecl.text = buffer.join('\n');
      currentDecl.endLine = lines.length - 1;
      declarations.push(currentDecl);
    }

    return declarations;
  }

  /**
   * Parse Go code
   */
  private parseGo(lines: string[]): Declaration[] {
    const declarations: Declaration[] = [];
    let currentDecl: Declaration | null = null;
    let braceCount = 0;
    let buffer: string[] = [];

    const patterns = {
      function: /^func\s+(?:\([^)]+\)\s+)?(\w+)\s*\(/,
      type: /^type\s+(\w+)\s+(?:struct|interface)/,
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      if (!currentDecl && (trimmed === '' || trimmed.startsWith('//'))) {
        continue;
      }

      if (!currentDecl) {
        let match: RegExpMatchArray | null = null;
        let type = '';

        for (const [declType, pattern] of Object.entries(patterns)) {
          match = trimmed.match(pattern);
          if (match) {
            type = declType;
            break;
          }
        }

        if (match) {
          currentDecl = {
            type,
            name: match[1],
            text: '',
            startLine: i,
            endLine: i,
          };
          buffer = [];
          braceCount = 0;
        }
      }

      if (currentDecl) {
        buffer.push(line);

        for (const char of line) {
          if (char === '{') braceCount++;
          if (char === '}') braceCount--;
        }

        if (braceCount === 0 && buffer.length > 0 && line.includes('}')) {
          currentDecl.text = buffer.join('\n');
          currentDecl.endLine = i;
          declarations.push(currentDecl);
          currentDecl = null;
        }
      }
    }

    if (currentDecl && buffer.length > 0) {
      currentDecl.text = buffer.join('\n');
      currentDecl.endLine = lines.length - 1;
      declarations.push(currentDecl);
    }

    return declarations;
  }

  /**
   * Parse Rust code
   */
  private parseRust(lines: string[]): Declaration[] {
    const declarations: Declaration[] = [];
    let currentDecl: Declaration | null = null;
    let braceCount = 0;
    let buffer: string[] = [];

    const patterns = {
      function: /^(?:pub\s+)?(?:async\s+)?fn\s+(\w+)/,
      struct: /^(?:pub\s+)?struct\s+(\w+)/,
      impl: /^impl(?:<[^>]+>)?\s+(\w+)/,
      trait: /^(?:pub\s+)?trait\s+(\w+)/,
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      if (!currentDecl && (trimmed === '' || trimmed.startsWith('//'))) {
        continue;
      }

      if (!currentDecl) {
        let match: RegExpMatchArray | null = null;
        let type = '';

        for (const [declType, pattern] of Object.entries(patterns)) {
          match = trimmed.match(pattern);
          if (match) {
            type = declType;
            break;
          }
        }

        if (match) {
          currentDecl = {
            type,
            name: match[1],
            text: '',
            startLine: i,
            endLine: i,
          };
          buffer = [];
          braceCount = 0;
        }
      }

      if (currentDecl) {
        buffer.push(line);

        for (const char of line) {
          if (char === '{') braceCount++;
          if (char === '}') braceCount--;
        }

        if (braceCount === 0 && buffer.length > 0 && line.includes('}')) {
          currentDecl.text = buffer.join('\n');
          currentDecl.endLine = i;
          declarations.push(currentDecl);
          currentDecl = null;
        }
      }
    }

    if (currentDecl && buffer.length > 0) {
      currentDecl.text = buffer.join('\n');
      currentDecl.endLine = lines.length - 1;
      declarations.push(currentDecl);
    }

    return declarations;
  }

  /**
   * Generic parsing using brace matching
   */
  private parseGeneric(lines: string[]): Declaration[] {
    const declarations: Declaration[] = [];
    let currentDecl: Declaration | null = null;
    let braceCount = 0;
    let buffer: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Look for function-like patterns
      if (!currentDecl && /(?:function|def|fn|func)\s+\w+/.test(trimmed)) {
        currentDecl = {
          type: 'function',
          name: trimmed.match(/(?:function|def|fn|func)\s+(\w+)/)?.[1] || 'unknown',
          text: '',
          startLine: i,
          endLine: i,
        };
        buffer = [];
        braceCount = 0;
      }

      if (currentDecl) {
        buffer.push(line);

        for (const char of line) {
          if (char === '{') braceCount++;
          if (char === '}') braceCount--;
        }

        if (braceCount === 0 && buffer.length > 0 && line.includes('}')) {
          currentDecl.text = buffer.join('\n');
          currentDecl.endLine = i;
          declarations.push(currentDecl);
          currentDecl = null;
        }
      }
    }

    return declarations;
  }

  /**
   * Split large declaration into smaller chunks
   */
  private splitLargeDeclaration(
    decl: Declaration,
    options: { chunkSize: number; maxChunkSize: number; minChunkSize: number; language: string }
  ): Chunk[] {
    const chunks: Chunk[] = [];
    const lines = decl.text.split('\n');

    // Get declaration signature (first few lines)
    const signatureLines: string[] = [];
    let braceFound = false;

    for (const line of lines) {
      signatureLines.push(line);
      if (line.includes('{')) {
        braceFound = true;
        break;
      }
      if (signatureLines.length >= 3) break;
    }

    const signature = signatureLines.join('\n');
    const prefix = `// ${decl.type}: ${decl.name} (continued)\n${signature}\n  // ...\n`;

    // Split remaining content
    let currentContent = '';
    let isFirst = true;

    for (let i = signatureLines.length; i < lines.length; i++) {
      const line = lines[i];

      if (currentContent.length + line.length > options.maxChunkSize - prefix.length) {
        if (currentContent.length >= options.minChunkSize) {
          chunks.push(this.createChunk(
            {
              ...decl,
              text: isFirst ? currentContent : prefix + currentContent,
            },
            chunks.length,
            options.language
          ));
          isFirst = false;
        }
        currentContent = line + '\n';
      } else {
        currentContent += line + '\n';
      }
    }

    // Add remaining content
    if (currentContent.length >= options.minChunkSize) {
      chunks.push(this.createChunk(
        {
          ...decl,
          text: isFirst ? currentContent : prefix + currentContent,
        },
        chunks.length,
        options.language
      ));
    }

    return chunks;
  }

  /**
   * Fall back to line-based chunking
   */
  private lineBasedChunking(
    code: string,
    options: { chunkSize: number; overlap: number; minChunkSize: number; maxChunkSize: number; language: string }
  ): Chunk[] {
    const chunks: Chunk[] = [];
    const lines = code.split('\n');
    let currentChunk: string[] = [];
    let currentLength = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (currentLength + line.length > options.maxChunkSize && currentChunk.length > 0) {
        if (currentLength >= options.minChunkSize) {
          chunks.push({
            id: `chunk_${Date.now()}_${chunks.length}`,
            content: currentChunk.join('\n'),
            metadata: {
              source: '',
              chunkIndex: chunks.length,
              startChar: 0,
              endChar: currentLength,
              type: 'code',
              language: options.language,
              startLine: i - currentChunk.length,
              endLine: i - 1,
              lineCount: currentChunk.length,
            },
          });
        }

        // Keep overlap lines
        const overlapLines = Math.max(1, Math.floor(options.overlap / 50));
        currentChunk = currentChunk.slice(-overlapLines);
        currentLength = currentChunk.join('\n').length;
      }

      currentChunk.push(line);
      currentLength += line.length + 1; // +1 for newline
    }

    // Add remaining chunk
    if (currentChunk.length > 0 && currentLength >= options.minChunkSize) {
      chunks.push({
        id: `chunk_${Date.now()}_${chunks.length}`,
        content: currentChunk.join('\n'),
        metadata: {
          source: '',
          chunkIndex: chunks.length,
          startChar: 0,
          endChar: currentLength,
          type: 'code',
          language: options.language,
          startLine: lines.length - currentChunk.length,
          endLine: lines.length - 1,
          lineCount: currentChunk.length,
        },
      });
    }

    return chunks;
  }

  /**
   * Create a chunk from a declaration
   */
  private createChunk(decl: Declaration, index: number, language: string): Chunk {
    return {
      id: `chunk_${Date.now()}_${index}`,
      content: decl.text,
      metadata: {
        source: '',
        chunkIndex: index,
        startChar: 0,
        endChar: decl.text.length,
        type: 'code',
        language,
        declarationType: decl.type,
        declarationName: decl.name,
        startLine: decl.startLine,
        endLine: decl.endLine,
        lineCount: decl.endLine - decl.startLine + 1,
      },
    };
  }
}

/**
 * Factory function for code chunker
 */
export function codeChunker(options: CodeChunkerOptions): CodeChunker {
  return new CodeChunker();
}
