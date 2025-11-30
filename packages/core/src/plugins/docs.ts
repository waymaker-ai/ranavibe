/**
 * Documentation Chatbot Plugin for RANA
 * AI-powered documentation Q&A with semantic search and citations
 */

import type { RanaClient } from '../client';
import type { Message } from '../types';
import {
  VectorMemory,
  createInMemoryVectorMemory,
  createFileVectorMemory,
  type VectorMemoryConfig,
  type EmbeddingProvider,
  type VectorSearchResult,
} from '../memory/vector';

// ============================================================================
// Types
// ============================================================================

/**
 * Supported documentation source types
 */
export type SourceType = 'markdown' | 'html' | 'pdf' | 'github' | 'notion' | 'text';

/**
 * Document source configuration
 */
export interface DocumentSource {
  /** Source type */
  type: SourceType;
  /** Source location (URL, file path, or identifier) */
  location: string;
  /** Optional metadata */
  metadata?: Record<string, any>;
}

/**
 * Document chunk with metadata
 */
export interface DocumentChunk {
  /** Unique chunk ID */
  id: string;
  /** Chunk content */
  content: string;
  /** Source document */
  source: DocumentSource;
  /** Chunk metadata */
  metadata: {
    /** Title or heading */
    title?: string;
    /** Section path (e.g., "Getting Started > Installation") */
    section?: string;
    /** Page number (for PDFs) */
    page?: number;
    /** Chunk index in document */
    index: number;
    /** Total chunks in document */
    totalChunks: number;
    /** Character offset in original document */
    offset: number;
    /** Indexed timestamp */
    indexedAt: Date;
  };
}

/**
 * Source citation in response
 */
export interface SourceCitation {
  /** Source document */
  source: DocumentSource;
  /** Relevant chunk */
  chunk: DocumentChunk;
  /** Similarity score */
  score: number;
  /** Snippet from chunk */
  snippet: string;
}

/**
 * Documentation answer with citations
 */
export interface DocsAnswer {
  /** Answer text */
  answer: string;
  /** Source citations */
  sources: SourceCitation[];
  /** Confidence score (0-1) */
  confidence: number;
  /** Follow-up questions */
  followUpQuestions?: string[];
}

/**
 * DocsPlugin configuration
 */
export interface DocsPluginConfig {
  /** RANA client instance */
  rana: RanaClient;

  /** Documentation sources to ingest */
  sources?: DocumentSource[];

  /** Chunk size in characters (default: 1000) */
  chunkSize?: number;

  /** Chunk overlap in characters (default: 200) */
  chunkOverlap?: number;

  /** Embedding model provider */
  embeddingModel?: string;

  /** Chat model for Q&A */
  chatModel?: string;

  /** Maximum sources to cite per response (default: 3) */
  maxSources?: number;

  /** Similarity threshold for search (default: 0.7) */
  similarityThreshold?: number;

  /** Vector memory configuration */
  vectorConfig?: Partial<VectorMemoryConfig>;

  /** Persistence file path (optional) */
  persistencePath?: string;

  /** Custom embedding provider */
  embeddingProvider?: EmbeddingProvider;

  /** Enable follow-up question generation (default: true) */
  enableFollowUps?: boolean;

  /** Enable conversational context (default: true) */
  enableContext?: boolean;

  /** Maximum conversation history to maintain (default: 5) */
  maxHistory?: number;
}

/**
 * Ingestion progress callback
 */
export interface IngestionProgress {
  /** Total documents to process */
  total: number;
  /** Documents processed */
  processed: number;
  /** Current document being processed */
  current: DocumentSource;
  /** Total chunks created */
  totalChunks: number;
}

// ============================================================================
// Document Chunking Utilities
// ============================================================================

/**
 * Chunk text into overlapping segments
 */
function chunkText(
  text: string,
  chunkSize: number,
  overlap: number
): { content: string; offset: number }[] {
  const chunks: { content: string; offset: number }[] = [];

  // Try to split on paragraph boundaries first
  const paragraphs = text.split(/\n\s*\n/);
  let currentChunk = '';
  let currentOffset = 0;
  let chunkStartOffset = 0;

  for (const paragraph of paragraphs) {
    // If adding this paragraph exceeds chunk size, save current chunk
    if (currentChunk.length > 0 && currentChunk.length + paragraph.length > chunkSize) {
      chunks.push({
        content: currentChunk.trim(),
        offset: chunkStartOffset,
      });

      // Start new chunk with overlap
      const overlapText = currentChunk.slice(-overlap);
      currentChunk = overlapText + '\n\n' + paragraph;
      chunkStartOffset = currentOffset - overlap;
    } else {
      if (currentChunk.length > 0) {
        currentChunk += '\n\n';
      }
      currentChunk += paragraph;
    }

    currentOffset += paragraph.length + 2; // +2 for \n\n
  }

  // Add final chunk
  if (currentChunk.trim().length > 0) {
    chunks.push({
      content: currentChunk.trim(),
      offset: chunkStartOffset,
    });
  }

  // If we got no chunks (no paragraphs), fall back to character-based chunking
  if (chunks.length === 0) {
    let offset = 0;
    while (offset < text.length) {
      const end = Math.min(offset + chunkSize, text.length);
      chunks.push({
        content: text.slice(offset, end),
        offset,
      });
      offset += chunkSize - overlap;
    }
  }

  return chunks;
}

/**
 * Extract title from markdown content
 */
function extractTitle(content: string): string | undefined {
  const titleMatch = content.match(/^#\s+(.+)$/m);
  return titleMatch?.[1];
}

/**
 * Extract section path from markdown headings
 */
function extractSection(content: string, offset: number): string | undefined {
  const lines = content.slice(0, offset).split('\n');
  const headings: string[] = [];

  for (const line of lines) {
    const match = line.match(/^(#{1,6})\s+(.+)$/);
    if (match) {
      const level = match[1].length;
      const text = match[2];

      // Keep only headings at this level or higher
      while (headings.length >= level) {
        headings.pop();
      }
      headings.push(text);
    }
  }

  return headings.length > 0 ? headings.join(' > ') : undefined;
}

// ============================================================================
// Simple Embedding Provider (uses RANA)
// ============================================================================

/**
 * Simple embedding provider that uses RANA chat completion
 * This is a basic implementation - in production, use a proper embedding API
 */
class SimpleEmbeddingProvider implements EmbeddingProvider {
  readonly dimensions: number = 384; // Small fixed size for demo

  constructor(private rana: RanaClient, private model?: string) {}

  async embed(text: string): Promise<number[]> {
    // This is a simple hash-based embedding for demo purposes
    // In production, use OpenAI embeddings, Cohere, or similar
    const hash = this.hashString(text);
    const embedding = new Array(this.dimensions).fill(0);

    // Fill embedding with deterministic values based on text
    for (let i = 0; i < this.dimensions; i++) {
      const charCode = text.charCodeAt(i % text.length) || 0;
      const hashVal = (hash + i) % 256;
      embedding[i] = (charCode / 255 + hashVal / 255) / 2;
    }

    // Normalize
    const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map(val => val / norm);
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  async batchEmbed(texts: string[]): Promise<number[][]> {
    return Promise.all(texts.map(text => this.embed(text)));
  }
}

// ============================================================================
// DocsPlugin Class
// ============================================================================

/**
 * Documentation Chatbot Plugin
 *
 * Provides AI-powered documentation search and Q&A with:
 * - Document ingestion from multiple sources
 * - Semantic search over documentation
 * - Question answering with source citations
 * - Context-aware follow-up questions
 *
 * @example
 * ```typescript
 * import { createRana } from '@rana/core';
 * import { DocsPlugin } from '@rana/core/plugins/docs';
 *
 * const rana = createRana({ ... });
 * const docs = new DocsPlugin({
 *   rana,
 *   sources: [
 *     { type: 'markdown', location: './docs' },
 *     { type: 'github', location: 'owner/repo' }
 *   ],
 *   chunkSize: 1000,
 *   maxSources: 3
 * });
 *
 * // Initialize and ingest
 * await docs.initialize();
 *
 * // Ask questions
 * const answer = await docs.ask('How do I install this?');
 * console.log(answer.answer);
 * console.log('Sources:', answer.sources);
 * ```
 */
export class DocsPlugin {
  private config: Required<DocsPluginConfig>;
  private vectorMemory!: VectorMemory;
  private conversationHistory: Message[] = [];
  private initialized: boolean = false;

  constructor(config: DocsPluginConfig) {
    // Set defaults
    this.config = {
      sources: [],
      chunkSize: 1000,
      chunkOverlap: 200,
      embeddingModel: 'text-embedding-3-small',
      chatModel: 'gpt-4o-mini',
      maxSources: 3,
      similarityThreshold: 0.7,
      vectorConfig: {},
      enableFollowUps: true,
      enableContext: true,
      maxHistory: 5,
      ...config,
      rana: config.rana,
      persistencePath: config.persistencePath,
      embeddingProvider: config.embeddingProvider,
    } as Required<DocsPluginConfig>;
  }

  // ============================================================================
  // Initialization
  // ============================================================================

  /**
   * Initialize the docs plugin and ingest configured sources
   */
  async initialize(
    onProgress?: (progress: IngestionProgress) => void
  ): Promise<void> {
    if (this.initialized) {
      return;
    }

    // Create embedding provider if not provided
    const embeddingProvider = this.config.embeddingProvider ||
      new SimpleEmbeddingProvider(this.config.rana, this.config.embeddingModel);

    // Create vector memory
    if (this.config.persistencePath) {
      this.vectorMemory = createFileVectorMemory(
        this.config.persistencePath,
        embeddingProvider.dimensions,
        {
          embeddingProvider,
          defaultThreshold: this.config.similarityThreshold,
          ...this.config.vectorConfig,
        }
      );
    } else {
      this.vectorMemory = createInMemoryVectorMemory(
        embeddingProvider.dimensions,
        {
          embeddingProvider,
          defaultThreshold: this.config.similarityThreshold,
          ...this.config.vectorConfig,
        }
      );
    }

    await this.vectorMemory.initialize();

    // Ingest configured sources
    if (this.config.sources && this.config.sources.length > 0) {
      await this.ingestAll(this.config.sources, onProgress);
    }

    this.initialized = true;
  }

  /**
   * Ensure plugin is initialized
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  // ============================================================================
  // Document Ingestion
  // ============================================================================

  /**
   * Ingest a single documentation source
   */
  async ingest(source: DocumentSource): Promise<number> {
    await this.ensureInitialized();

    let content: string;

    // Fetch content based on source type
    switch (source.type) {
      case 'markdown':
      case 'text':
        content = await this.fetchFileContent(source.location);
        break;
      case 'html':
        content = await this.fetchHtmlContent(source.location);
        break;
      case 'pdf':
        content = await this.fetchPdfContent(source.location);
        break;
      case 'github':
        content = await this.fetchGithubContent(source.location);
        break;
      case 'notion':
        content = await this.fetchNotionContent(source.location);
        break;
      default:
        throw new Error(`Unsupported source type: ${source.type}`);
    }

    // Chunk the content
    const chunks = chunkText(
      content,
      this.config.chunkSize,
      this.config.chunkOverlap
    );

    // Index chunks in vector memory
    let indexed = 0;
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const chunkData: DocumentChunk = {
        id: `${source.location}_chunk_${i}`,
        content: chunk.content,
        source,
        metadata: {
          title: extractTitle(content),
          section: extractSection(content, chunk.offset),
          index: i,
          totalChunks: chunks.length,
          offset: chunk.offset,
          indexedAt: new Date(),
        },
      };

      await this.vectorMemory.store(
        chunk.content,
        {
          ...chunkData,
          sourceLocation: source.location,
          sourceType: source.type,
        }
      );
      indexed++;
    }

    return indexed;
  }

  /**
   * Ingest multiple documentation sources
   */
  async ingestAll(
    sources: DocumentSource[],
    onProgress?: (progress: IngestionProgress) => void
  ): Promise<number> {
    await this.ensureInitialized();

    let totalChunks = 0;

    for (let i = 0; i < sources.length; i++) {
      const source = sources[i];

      if (onProgress) {
        onProgress({
          total: sources.length,
          processed: i,
          current: source,
          totalChunks,
        });
      }

      const chunks = await this.ingest(source);
      totalChunks += chunks;
    }

    if (onProgress) {
      onProgress({
        total: sources.length,
        processed: sources.length,
        current: sources[sources.length - 1],
        totalChunks,
      });
    }

    return totalChunks;
  }

  /**
   * Re-index all documentation (clear and re-ingest)
   */
  async refresh(): Promise<number> {
    await this.ensureInitialized();

    // Clear existing index
    await this.vectorMemory.clear();

    // Re-ingest all sources
    return await this.ingestAll(this.config.sources);
  }

  // ============================================================================
  // Search & Question Answering
  // ============================================================================

  /**
   * Search documentation for relevant chunks
   */
  async search(
    query: string,
    limit?: number
  ): Promise<VectorSearchResult[]> {
    await this.ensureInitialized();

    const k = limit || this.config.maxSources;
    return await this.vectorMemory.search(
      query,
      k,
      this.config.similarityThreshold
    );
  }

  /**
   * Ask a question about the documentation
   */
  async ask(
    question: string,
    options?: {
      maxSources?: number;
      includeFollowUps?: boolean;
      useContext?: boolean;
    }
  ): Promise<DocsAnswer> {
    await this.ensureInitialized();

    const maxSources = options?.maxSources || this.config.maxSources;
    const includeFollowUps = options?.includeFollowUps ?? this.config.enableFollowUps;
    const useContext = options?.useContext ?? this.config.enableContext;

    // Search for relevant documentation
    const searchResults = await this.search(question, maxSources * 2);

    if (searchResults.length === 0) {
      return {
        answer: "I couldn't find any relevant documentation to answer your question. Please try rephrasing or check if the documentation has been indexed.",
        sources: [],
        confidence: 0,
      };
    }

    // Build context from search results
    const context = searchResults
      .slice(0, maxSources)
      .map((result, i) => {
        const metadata = result.entry.metadata;
        const header = metadata.title || metadata.section || metadata.sourceLocation;
        return `[Source ${i + 1}${header ? `: ${header}` : ''}]\n${result.entry.content}`;
      })
      .join('\n\n---\n\n');

    // Build conversation messages
    const messages: Message[] = [];

    // Add conversation history if enabled
    if (useContext && this.conversationHistory.length > 0) {
      messages.push(...this.conversationHistory.slice(-this.config.maxHistory * 2));
    }

    // System message
    const systemPrompt = `You are a helpful documentation assistant. Answer questions based on the provided documentation context.
Always cite your sources using [Source N] notation. If the documentation doesn't contain enough information to answer the question, say so clearly.
Be concise but thorough. Use markdown formatting when appropriate.`;

    // Build user message with context
    const userMessage = `Documentation Context:
${context}

Question: ${question}

Please provide a clear, accurate answer based on the documentation above. Cite your sources using [Source N] notation.`;

    messages.push(
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage }
    );

    // Get answer from LLM
    const response = await this.config.rana.chat({
      model: this.config.chatModel,
      messages,
      temperature: 0.3,
    });

    const answer = response.content;

    // Update conversation history
    if (useContext) {
      this.conversationHistory.push(
        { role: 'user', content: question },
        { role: 'assistant', content: answer }
      );

      // Trim history if too long
      if (this.conversationHistory.length > this.config.maxHistory * 2) {
        this.conversationHistory = this.conversationHistory.slice(-this.config.maxHistory * 2);
      }
    }

    // Build citations
    const citations: SourceCitation[] = searchResults
      .slice(0, maxSources)
      .map(result => {
        const metadata = result.entry.metadata;
        const chunk: DocumentChunk = {
          id: result.entry.id,
          content: result.entry.content,
          source: {
            type: metadata.sourceType,
            location: metadata.sourceLocation,
            metadata: metadata,
          },
          metadata: {
            title: metadata.title,
            section: metadata.section,
            page: metadata.page,
            index: metadata.index,
            totalChunks: metadata.totalChunks,
            offset: metadata.offset,
            indexedAt: new Date(metadata.indexedAt),
          },
        };

        return {
          source: chunk.source,
          chunk,
          score: result.score,
          snippet: result.entry.content.slice(0, 200) + '...',
        };
      });

    // Calculate confidence based on top search score
    const confidence = searchResults.length > 0 ? searchResults[0].score : 0;

    // Generate follow-up questions if enabled
    let followUpQuestions: string[] | undefined;
    if (includeFollowUps) {
      followUpQuestions = await this.generateFollowUps(question, answer);
    }

    return {
      answer,
      sources: citations,
      confidence,
      followUpQuestions,
    };
  }

  /**
   * Generate follow-up questions based on the conversation
   */
  private async generateFollowUps(
    question: string,
    answer: string
  ): Promise<string[]> {
    try {
      const response = await this.config.rana.chat({
        model: this.config.chatModel,
        messages: [
          {
            role: 'system',
            content: 'Generate 2-3 concise follow-up questions that a user might ask after receiving this answer. Return only the questions, one per line, without numbering.',
          },
          {
            role: 'user',
            content: `Question: ${question}\n\nAnswer: ${answer}\n\nGenerate follow-up questions:`,
          },
        ],
        temperature: 0.7,
        max_tokens: 150,
      });

      return response.content
        .split('\n')
        .map(q => q.trim())
        .filter(q => q.length > 0 && q.endsWith('?'))
        .slice(0, 3);
    } catch (error) {
      // If follow-up generation fails, just return empty array
      return [];
    }
  }

  /**
   * Get source citations from last answer
   */
  getSources(): SourceCitation[] {
    // This would need to be tracked in state - for now return empty
    return [];
  }

  /**
   * Clear conversation history
   */
  clearHistory(): void {
    this.conversationHistory = [];
  }

  // ============================================================================
  // Content Fetchers
  // ============================================================================

  /**
   * Fetch file content (for markdown/text files)
   */
  private async fetchFileContent(path: string): Promise<string> {
    // In browser environment
    if (typeof globalThis !== 'undefined' && typeof (globalThis as any).window !== 'undefined') {
      const response = await fetch(path);
      return await response.text();
    }

    // In Node.js environment
    const fs = await import('fs/promises');
    const pathModule = await import('path');

    try {
      // Check if it's a directory
      const stats = await fs.stat(path);
      if (stats.isDirectory()) {
        // Read all markdown files in directory
        const files = await fs.readdir(path);
        const markdownFiles = files.filter(f =>
          f.endsWith('.md') || f.endsWith('.markdown') || f.endsWith('.txt')
        );

        const contents = await Promise.all(
          markdownFiles.map(async (file) => {
            const filePath = pathModule.join(path, file);
            const content = await fs.readFile(filePath, 'utf-8');
            return `# ${file}\n\n${content}`;
          })
        );

        return contents.join('\n\n---\n\n');
      } else {
        // Single file
        return await fs.readFile(path, 'utf-8');
      }
    } catch (error) {
      throw new Error(`Failed to read file: ${path} - ${error}`);
    }
  }

  /**
   * Fetch and parse HTML content
   */
  private async fetchHtmlContent(url: string): Promise<string> {
    const response = await fetch(url);
    const html = await response.text();

    // Basic HTML to text conversion (remove tags)
    // In production, use a proper HTML parser like cheerio or jsdom
    const text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    return text;
  }

  /**
   * Fetch and parse PDF content
   */
  private async fetchPdfContent(path: string): Promise<string> {
    // PDF parsing requires external library like pdf-parse
    // This is a placeholder implementation
    throw new Error('PDF parsing not yet implemented. Install pdf-parse for PDF support.');
  }

  /**
   * Fetch GitHub repository documentation
   */
  private async fetchGithubContent(repo: string): Promise<string> {
    // Parse owner/repo format
    const [owner, repoName] = repo.split('/');

    // Fetch README.md by default
    const url = `https://raw.githubusercontent.com/${owner}/${repoName}/main/README.md`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        // Try master branch
        const masterUrl = `https://raw.githubusercontent.com/${owner}/${repoName}/master/README.md`;
        const masterResponse = await fetch(masterUrl);
        return await masterResponse.text();
      }
      return await response.text();
    } catch (error) {
      throw new Error(`Failed to fetch GitHub content: ${repo} - ${error}`);
    }
  }

  /**
   * Fetch Notion page content
   */
  private async fetchNotionContent(pageId: string): Promise<string> {
    // Notion API integration requires authentication and SDK
    // This is a placeholder implementation
    throw new Error('Notion integration not yet implemented. Use the official Notion SDK.');
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  /**
   * Get plugin statistics
   */
  async getStats() {
    await this.ensureInitialized();

    const vectorStats = this.vectorMemory.getStats();
    const count = await this.vectorMemory.count();

    return {
      totalChunks: count,
      totalSources: this.config.sources.length,
      conversationTurns: this.conversationHistory.length / 2,
      vectorStats,
    };
  }

  /**
   * Close and cleanup resources
   */
  async close(): Promise<void> {
    if (this.vectorMemory) {
      await this.vectorMemory.close();
    }
    this.initialized = false;
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create a new DocsPlugin instance
 */
export function createDocsPlugin(config: DocsPluginConfig): DocsPlugin {
  return new DocsPlugin(config);
}

// ============================================================================
// Exports
// ============================================================================

export default DocsPlugin;
