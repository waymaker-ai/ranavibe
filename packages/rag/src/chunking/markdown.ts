/**
 * Markdown Chunker
 * Chunk markdown while preserving structure (headers, code blocks, lists)
 */

import type { Chunk, Chunker, MarkdownChunkerOptions } from '../types';

interface Section {
  header: string;
  level: number;
  content: string[];
  metadata: Record<string, unknown>;
}

export class MarkdownChunker implements Chunker {
  /**
   * Chunk markdown while preserving structure
   */
  async chunk(markdown: string, options: MarkdownChunkerOptions = {}): Promise<Chunk[]> {
    const {
      chunkSize = 512,
      overlap = 50,
      preserveHeaders = true,
      preserveCodeBlocks = true,
      preserveLists = true,
      minChunkSize = 50,
      maxChunkSize = 2000,
    } = options;

    // 1. Extract sections based on headers
    const sections = this.extractSections(markdown);

    // 2. Chunk each section
    const chunks: Chunk[] = [];

    for (const section of sections) {
      const sectionChunks = await this.chunkSection(section, {
        chunkSize,
        overlap,
        preserveHeaders,
        preserveCodeBlocks,
        preserveLists,
        minChunkSize,
        maxChunkSize,
      });
      chunks.push(...sectionChunks);
    }

    // 3. Re-index chunks
    return chunks.map((chunk, i) => ({
      ...chunk,
      id: `chunk_${Date.now()}_${i}`,
      metadata: {
        ...chunk.metadata,
        chunkIndex: i,
        totalChunks: chunks.length,
      },
    }));
  }

  /**
   * Extract sections from markdown based on headers
   */
  private extractSections(markdown: string): Section[] {
    const lines = markdown.split('\n');
    const sections: Section[] = [];
    let currentSection: Section | null = null;

    for (const line of lines) {
      const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);

      if (headerMatch) {
        // Save previous section
        if (currentSection && currentSection.content.length > 0) {
          sections.push(currentSection);
        }

        // Start new section
        currentSection = {
          header: headerMatch[2],
          level: headerMatch[1].length,
          content: [],
          metadata: {
            headerLevel: headerMatch[1].length,
          },
        };
      } else if (currentSection) {
        currentSection.content.push(line);
      } else {
        // Content before first header
        if (!currentSection) {
          currentSection = {
            header: '',
            level: 0,
            content: [line],
            metadata: {},
          };
        }
      }
    }

    // Save last section
    if (currentSection && currentSection.content.length > 0) {
      sections.push(currentSection);
    }

    return sections;
  }

  /**
   * Chunk a single section
   */
  private async chunkSection(
    section: Section,
    options: MarkdownChunkerOptions & {
      minChunkSize: number;
      maxChunkSize: number;
    }
  ): Promise<Chunk[]> {
    const chunks: Chunk[] = [];
    const header = section.level > 0
      ? `${'#'.repeat(section.level)} ${section.header}\n\n`
      : '';

    const content = section.content.join('\n');

    // If content fits in one chunk, return it
    if (header.length + content.length <= options.maxChunkSize) {
      if (header.length + content.length >= options.minChunkSize) {
        chunks.push(this.createChunk(
          (header + content).trim(),
          chunks.length,
          section.header,
          section.level
        ));
      }
      return chunks;
    }

    // Split content into paragraphs
    const paragraphs = this.splitIntoParagraphs(content, options);

    let currentChunk = header;
    let charOffset = 0;

    for (const paragraph of paragraphs) {
      // Check if adding this paragraph exceeds chunk size
      if (currentChunk.length + paragraph.length > options.maxChunkSize && currentChunk !== header) {
        // Save current chunk
        if (currentChunk.trim().length >= options.minChunkSize) {
          chunks.push(this.createChunk(
            currentChunk.trim(),
            chunks.length,
            section.header,
            section.level
          ));
        }

        // Start new chunk with header
        currentChunk = options.preserveHeaders ? header : '';
        charOffset += currentChunk.length;
      }

      currentChunk += paragraph + '\n\n';
    }

    // Save last chunk
    if (currentChunk.trim() !== header.trim() && currentChunk.trim().length >= options.minChunkSize) {
      chunks.push(this.createChunk(
        currentChunk.trim(),
        chunks.length,
        section.header,
        section.level
      ));
    }

    return chunks;
  }

  /**
   * Split content into paragraphs while preserving code blocks and lists
   */
  private splitIntoParagraphs(content: string, options: MarkdownChunkerOptions): string[] {
    const paragraphs: string[] = [];
    const lines = content.split('\n');

    let currentParagraph: string[] = [];
    let inCodeBlock = false;
    let inList = false;

    for (const line of lines) {
      // Handle code blocks
      if (line.startsWith('```')) {
        if (inCodeBlock) {
          // End of code block
          currentParagraph.push(line);
          if (options.preserveCodeBlocks) {
            paragraphs.push(currentParagraph.join('\n'));
            currentParagraph = [];
          }
          inCodeBlock = false;
        } else {
          // Start of code block
          if (currentParagraph.length > 0) {
            paragraphs.push(currentParagraph.join('\n'));
            currentParagraph = [];
          }
          currentParagraph.push(line);
          inCodeBlock = true;
        }
        continue;
      }

      if (inCodeBlock) {
        currentParagraph.push(line);
        continue;
      }

      // Handle lists
      const isListItem = /^\s*[-*+]\s|^\s*\d+\.\s/.test(line);

      if (isListItem) {
        if (!inList && currentParagraph.length > 0) {
          paragraphs.push(currentParagraph.join('\n'));
          currentParagraph = [];
        }
        inList = true;
        currentParagraph.push(line);
        continue;
      }

      if (inList && line.trim() === '') {
        // End of list
        if (options.preserveLists && currentParagraph.length > 0) {
          paragraphs.push(currentParagraph.join('\n'));
          currentParagraph = [];
        }
        inList = false;
        continue;
      }

      // Handle regular paragraphs
      if (line.trim() === '') {
        if (currentParagraph.length > 0) {
          paragraphs.push(currentParagraph.join('\n'));
          currentParagraph = [];
        }
      } else {
        currentParagraph.push(line);
      }
    }

    // Save remaining content
    if (currentParagraph.length > 0) {
      paragraphs.push(currentParagraph.join('\n'));
    }

    return paragraphs.filter(p => p.trim().length > 0);
  }

  /**
   * Create a chunk with metadata
   */
  private createChunk(
    content: string,
    index: number,
    header: string,
    headerLevel: number
  ): Chunk {
    return {
      id: `chunk_${Date.now()}_${index}`,
      content,
      metadata: {
        source: '',
        chunkIndex: index,
        startChar: 0,
        endChar: content.length,
        type: 'markdown',
        header,
        headerLevel,
        hasCodeBlock: content.includes('```'),
        hasList: /^\s*[-*+]\s|^\s*\d+\.\s/m.test(content),
        wordCount: content.split(/\s+/).length,
      },
    };
  }
}

/**
 * Factory function for markdown chunker
 */
export function markdownChunker(options?: MarkdownChunkerOptions): MarkdownChunker {
  return new MarkdownChunker();
}
