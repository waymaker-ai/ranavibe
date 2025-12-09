/**
 * Document Loaders
 * Load content from various sources for knowledge base ingestion
 */

import type { IngestionSource } from './types';

/**
 * Base loader interface
 */
export interface Loader {
  load(): Promise<string>;
}

/**
 * File loader
 */
export class FileLoader implements Loader {
  constructor(
    private path: string,
    private encoding: BufferEncoding = 'utf-8'
  ) {}

  async load(): Promise<string> {
    // Dynamic import for Node.js fs
    const fs = await import('fs').then(m => m.promises);
    return fs.readFile(this.path, { encoding: this.encoding });
  }
}

/**
 * URL loader with HTML to text conversion
 */
export class URLLoader implements Loader {
  constructor(
    private url: string,
    private options?: {
      headers?: Record<string, string>;
      timeout?: number;
    }
  ) {}

  async load(): Promise<string> {
    const controller = new AbortController();
    const timeout = this.options?.timeout || 30000;

    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(this.url, {
        headers: this.options?.headers,
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch ${this.url}: ${response.status}`);
      }

      const html = await response.text();
      return this.htmlToText(html);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private htmlToText(html: string): string {
    // Simple HTML to text conversion
    return html
      // Remove scripts and styles
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      // Remove HTML comments
      .replace(/<!--[\s\S]*?-->/g, '')
      // Replace block elements with newlines
      .replace(/<\/(p|div|h[1-6]|li|tr|br|hr)[^>]*>/gi, '\n')
      // Remove all remaining tags
      .replace(/<[^>]+>/g, '')
      // Decode HTML entities
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code)))
      // Clean up whitespace
      .replace(/\n\s*\n/g, '\n\n')
      .trim();
  }
}

/**
 * GitHub loader
 */
export class GitHubLoader implements Loader {
  constructor(
    private repo: string,
    private options?: {
      branch?: string;
      path?: string;
      token?: string;
    }
  ) {}

  async load(): Promise<string> {
    const branch = this.options?.branch || 'main';
    const path = this.options?.path || '';

    const url = `https://api.github.com/repos/${this.repo}/contents/${path}?ref=${branch}`;

    const headers: Record<string, string> = {
      Accept: 'application/vnd.github.v3.raw',
    };

    if (this.options?.token) {
      headers.Authorization = `Bearer ${this.options.token}`;
    }

    const response = await fetch(url, { headers });

    if (!response.ok) {
      throw new Error(`Failed to fetch from GitHub: ${response.status}`);
    }

    return response.text();
  }
}

/**
 * Directory loader - expands to multiple file sources
 */
export class DirectoryLoader {
  constructor(
    private path: string,
    private options?: {
      glob?: string;
      recursive?: boolean;
      extensions?: string[];
    }
  ) {}

  async expand(): Promise<IngestionSource[]> {
    const fs = await import('fs').then(m => m.promises);
    const pathModule = await import('path');

    const sources: IngestionSource[] = [];
    const glob = this.options?.glob || '*';
    const recursive = this.options?.recursive ?? true;

    await this.walkDirectory(this.path, async (filePath) => {
      // Check extension filter
      if (this.options?.extensions?.length) {
        const ext = pathModule.extname(filePath).toLowerCase();
        if (!this.options.extensions.includes(ext)) {
          return;
        }
      }

      // Simple glob matching
      const fileName = pathModule.basename(filePath);
      if (this.matchGlob(fileName, glob)) {
        sources.push({
          type: 'file',
          path: filePath,
          metadata: {
            directory: this.path,
            relativePath: pathModule.relative(this.path, filePath),
          },
        });
      }
    }, recursive);

    return sources;
  }

  private async walkDirectory(
    dir: string,
    callback: (path: string) => Promise<void>,
    recursive: boolean
  ): Promise<void> {
    const fs = await import('fs').then(m => m.promises);
    const pathModule = await import('path');

    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = pathModule.join(dir, entry.name);

      if (entry.isDirectory() && recursive) {
        await this.walkDirectory(fullPath, callback, recursive);
      } else if (entry.isFile()) {
        await callback(fullPath);
      }
    }
  }

  private matchGlob(fileName: string, glob: string): boolean {
    // Simple glob matching (supports * and ?)
    const regex = new RegExp(
      '^' +
        glob
          .replace(/[.+^${}()|[\]\\]/g, '\\$&')
          .replace(/\*/g, '.*')
          .replace(/\?/g, '.') +
        '$'
    );
    return regex.test(fileName);
  }
}

/**
 * JSON loader
 */
export class JSONLoader implements Loader {
  constructor(
    private source: string | object,
    private options?: {
      contentField?: string;
      metadataFields?: string[];
    }
  ) {}

  async load(): Promise<string> {
    const data = typeof this.source === 'string'
      ? JSON.parse(this.source)
      : this.source;

    if (this.options?.contentField) {
      return String(data[this.options.contentField] || '');
    }

    return JSON.stringify(data, null, 2);
  }
}

/**
 * PDF loader (requires external parsing)
 */
export class PDFLoader implements Loader {
  constructor(
    private path: string,
    private options?: {
      pageRange?: [number, number];
    }
  ) {}

  async load(): Promise<string> {
    // This would require a PDF parsing library like pdf-parse
    throw new Error(
      'PDF loading requires additional dependencies. Install pdf-parse to use this loader.'
    );
  }
}

/**
 * Create a loader for a source
 */
export function createLoader(source: IngestionSource): Loader {
  switch (source.type) {
    case 'text':
      return {
        async load() {
          return source.content;
        },
      };
    case 'file':
      return new FileLoader(source.path);
    case 'url':
      return new URLLoader(source.url);
    case 'github':
      return new GitHubLoader(source.repo, {
        branch: source.branch,
        path: source.path,
      });
    default:
      throw new Error(`No loader available for source type: ${(source as any).type}`);
  }
}

/**
 * Expand directory sources into individual file sources
 */
export async function expandDirectorySource(
  source: IngestionSource & { type: 'directory' }
): Promise<IngestionSource[]> {
  const loader = new DirectoryLoader(source.path, {
    glob: source.glob,
    recursive: source.recursive,
  });

  const files = await loader.expand();

  // Add original metadata to each file
  return files.map(file => ({
    ...file,
    metadata: {
      ...source.metadata,
      ...file.metadata,
    },
  }));
}
