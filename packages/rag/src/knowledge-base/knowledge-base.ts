/**
 * Knowledge Base Implementation
 * High-level document management for RAG systems
 */

import type { Chunk, Document, Chunker, ChunkerOptions } from '../types';
import type {
  KnowledgeBaseConfig,
  KBDocument,
  IngestionSource,
  IngestionOptions,
  IngestionResult,
  IngestionError,
  KBSearchOptions,
  KBSearchResult,
  KBStats,
  DocumentUpdateOptions,
  BulkOperationResult,
} from './types';

/**
 * Abstract vector store interface
 */
export interface VectorStore {
  upsert(chunks: Chunk[]): Promise<void>;
  search(embedding: number[], options?: { limit?: number; filter?: Record<string, unknown> }): Promise<Array<{ id: string; score: number; metadata: Record<string, unknown> }>>;
  delete(ids: string[]): Promise<void>;
  deleteByFilter(filter: Record<string, unknown>): Promise<number>;
  count(filter?: Record<string, unknown>): Promise<number>;
}

/**
 * Abstract embedding provider interface
 */
export interface EmbeddingProvider {
  embed(text: string): Promise<number[]>;
  embedBatch(texts: string[]): Promise<number[][]>;
}

/**
 * Knowledge Base class
 * Provides high-level document management on top of RAG primitives
 */
export class KnowledgeBase {
  private config: KnowledgeBaseConfig;
  private vectorStore: VectorStore;
  private embeddings: EmbeddingProvider;
  private chunker: Chunker;
  private documents: Map<string, KBDocument> = new Map();

  constructor(
    config: KnowledgeBaseConfig,
    vectorStore: VectorStore,
    embeddings: EmbeddingProvider,
    chunker: Chunker
  ) {
    this.config = config;
    this.vectorStore = vectorStore;
    this.embeddings = embeddings;
    this.chunker = chunker;
  }

  /**
   * Get knowledge base ID
   */
  get id(): string {
    return this.config.id;
  }

  /**
   * Get knowledge base name
   */
  get name(): string {
    return this.config.name;
  }

  /**
   * Ingest documents from various sources
   */
  async ingest(
    sources: IngestionSource[],
    options: IngestionOptions = {}
  ): Promise<IngestionResult> {
    const startTime = Date.now();
    const result: IngestionResult = {
      total: sources.length,
      successful: 0,
      failed: 0,
      skipped: 0,
      documentIds: [],
      errors: [],
      processingTime: 0,
    };

    const batchSize = options.batchSize || 10;

    for (let i = 0; i < sources.length; i += batchSize) {
      const batch = sources.slice(i, i + batchSize);

      await Promise.all(
        batch.map(async (source, batchIndex) => {
          const index = i + batchIndex;
          try {
            const document = await this.processSource(source, index, options);

            if (!document) {
              result.skipped++;
              return;
            }

            // Check if document exists
            if (this.documents.has(document.id)) {
              if (options.skipExisting) {
                result.skipped++;
                return;
              }
              if (!options.updateExisting) {
                result.skipped++;
                return;
              }
            }

            // Chunk the document
            const chunks = await this.chunkDocument(document);

            // Generate embeddings
            const embeddings = await this.embeddings.embedBatch(
              chunks.map(c => c.content)
            );

            // Add embeddings to chunks
            const chunksWithEmbeddings = chunks.map((chunk, idx) => ({
              ...chunk,
              embedding: embeddings[idx],
            }));

            // Store in vector store
            await this.vectorStore.upsert(chunksWithEmbeddings);

            // Track document
            this.documents.set(document.id, document);
            result.documentIds.push(document.id);
            result.successful++;
          } catch (error) {
            result.failed++;
            result.errors.push({
              source,
              error: error instanceof Error ? error.message : String(error),
              stack: error instanceof Error ? error.stack : undefined,
            });
          }
        })
      );
    }

    result.processingTime = Date.now() - startTime;
    return result;
  }

  /**
   * Process a single source into a document
   */
  private async processSource(
    source: IngestionSource,
    index: number,
    options: IngestionOptions
  ): Promise<KBDocument | null> {
    let content: string;
    let metadata: Record<string, unknown> = source.metadata || {};

    switch (source.type) {
      case 'text':
        content = source.content;
        break;
      case 'file':
        content = await this.loadFile(source.path);
        metadata = { ...metadata, source: source.path };
        break;
      case 'url':
        content = await this.loadUrl(source.url);
        metadata = { ...metadata, source: source.url };
        break;
      case 'directory':
        // Directory sources should be expanded before calling ingest
        throw new Error('Directory sources must be expanded before ingestion');
      case 'github':
        content = await this.loadGitHub(source.repo, source.branch, source.path);
        metadata = { ...metadata, source: `github:${source.repo}` };
        break;
      case 'notion':
        content = await this.loadNotion(source.pageId);
        metadata = { ...metadata, source: `notion:${source.pageId}` };
        break;
      case 'confluence':
        content = await this.loadConfluence(source.spaceKey, source.pageId);
        metadata = { ...metadata, source: `confluence:${source.spaceKey}` };
        break;
      default:
        throw new Error(`Unknown source type: ${(source as any).type}`);
    }

    // Pre-process hook
    if (options.preProcess) {
      const processed = await options.preProcess(content, metadata);
      content = processed.content;
      metadata = processed.metadata;
    }

    // Generate ID
    const id = options.idGenerator
      ? options.idGenerator(source, index)
      : this.generateDocumentId(source, index);

    const document: KBDocument = {
      id,
      content,
      metadata,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Post-process hook
    if (options.postProcess) {
      return options.postProcess(document);
    }

    return document;
  }

  /**
   * Generate a document ID
   */
  private generateDocumentId(source: IngestionSource, index: number): string {
    const prefix = `${this.config.id}-`;
    switch (source.type) {
      case 'text':
        return `${prefix}text-${index}-${Date.now()}`;
      case 'file':
        return `${prefix}file-${Buffer.from(source.path).toString('base64').slice(0, 20)}`;
      case 'url':
        return `${prefix}url-${Buffer.from(source.url).toString('base64').slice(0, 20)}`;
      case 'github':
        return `${prefix}gh-${source.repo.replace('/', '-')}-${source.path || 'root'}`;
      case 'notion':
        return `${prefix}notion-${source.pageId}`;
      case 'confluence':
        return `${prefix}confluence-${source.spaceKey}-${source.pageId || 'space'}`;
      default:
        return `${prefix}doc-${index}-${Date.now()}`;
    }
  }

  /**
   * Chunk a document
   */
  private async chunkDocument(document: KBDocument): Promise<Chunk[]> {
    const chunks = await this.chunker.chunk(document.content, {
      chunkSize: this.config.chunking?.chunkSize,
      overlap: this.config.chunking?.overlap,
      ...this.config.chunking?.options,
    } as ChunkerOptions);

    // Add document metadata to chunks
    return chunks.map((chunk, index) => ({
      ...chunk,
      id: `${document.id}-chunk-${index}`,
      metadata: {
        ...chunk.metadata,
        documentId: document.id,
        knowledgeBaseId: this.config.id,
        ...document.metadata,
      },
    }));
  }

  /**
   * Search the knowledge base
   */
  async search(query: string, options: KBSearchOptions = {}): Promise<KBSearchResult[]> {
    const embedding = await this.embeddings.embed(query);

    const filter: Record<string, unknown> = {
      knowledgeBaseId: this.config.id,
      ...options.filters,
    };

    if (options.tags?.length) {
      filter.tags = { $in: options.tags };
    }

    if (options.access?.length) {
      filter.access = { $in: options.access };
    }

    const results = await this.vectorStore.search(embedding, {
      limit: options.limit || 10,
      filter,
    });

    return results
      .filter(r => !options.minScore || r.score >= options.minScore)
      .map(r => ({
        documentId: r.metadata.documentId as string,
        title: r.metadata.title as string | undefined,
        chunkId: r.id,
        content: r.metadata.content as string || '',
        score: r.score,
        metadata: r.metadata,
        chunkIndex: r.metadata.chunkIndex as number || 0,
      }));
  }

  /**
   * Get a document by ID
   */
  async getDocument(id: string): Promise<KBDocument | null> {
    return this.documents.get(id) || null;
  }

  /**
   * Update a document
   */
  async updateDocument(
    id: string,
    updates: Partial<KBDocument>,
    options: DocumentUpdateOptions = {}
  ): Promise<KBDocument | null> {
    const existing = this.documents.get(id);
    if (!existing) {
      return null;
    }

    const updated: KBDocument = options.replace
      ? { ...updates, id, createdAt: existing.createdAt, updatedAt: new Date() } as KBDocument
      : {
          ...existing,
          ...updates,
          metadata: options.mergeMetadata
            ? { ...existing.metadata, ...updates.metadata }
            : updates.metadata || existing.metadata,
          updatedAt: new Date(),
        };

    // Re-chunk if content changed
    if (options.rechunk || updates.content) {
      // Delete old chunks
      await this.vectorStore.deleteByFilter({ documentId: id });

      // Create new chunks
      const chunks = await this.chunkDocument(updated);
      const embeddings = await this.embeddings.embedBatch(chunks.map(c => c.content));
      const chunksWithEmbeddings = chunks.map((chunk, idx) => ({
        ...chunk,
        embedding: embeddings[idx],
      }));
      await this.vectorStore.upsert(chunksWithEmbeddings);
    }

    this.documents.set(id, updated);
    return updated;
  }

  /**
   * Delete a document
   */
  async deleteDocument(id: string): Promise<boolean> {
    if (!this.documents.has(id)) {
      return false;
    }

    await this.vectorStore.deleteByFilter({ documentId: id });
    this.documents.delete(id);
    return true;
  }

  /**
   * Delete multiple documents
   */
  async deleteDocuments(ids: string[]): Promise<BulkOperationResult> {
    const result: BulkOperationResult = {
      successful: 0,
      failed: 0,
      errors: [],
    };

    for (const id of ids) {
      try {
        const deleted = await this.deleteDocument(id);
        if (deleted) {
          result.successful++;
        } else {
          result.failed++;
          result.errors.push({ id, error: 'Document not found' });
        }
      } catch (error) {
        result.failed++;
        result.errors.push({
          id,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return result;
  }

  /**
   * List all documents
   */
  async listDocuments(options?: {
    limit?: number;
    offset?: number;
    tags?: string[];
  }): Promise<KBDocument[]> {
    let docs = Array.from(this.documents.values());

    if (options?.tags?.length) {
      docs = docs.filter(d =>
        d.tags?.some(t => options.tags!.includes(t))
      );
    }

    const offset = options?.offset || 0;
    const limit = options?.limit || 100;

    return docs.slice(offset, offset + limit);
  }

  /**
   * Get knowledge base statistics
   */
  async getStats(): Promise<KBStats> {
    const documentCount = this.documents.size;
    const chunkCount = await this.vectorStore.count({ knowledgeBaseId: this.config.id });

    // Estimate token count (rough approximation)
    let tokenCount = 0;
    for (const doc of this.documents.values()) {
      tokenCount += Math.ceil(doc.content.length / 4); // ~4 chars per token
    }

    return {
      documentCount,
      chunkCount,
      tokenCount,
      storageSize: 0, // Would need provider-specific implementation
      vectorStore: {
        dimensions: this.config.embedding.dimensions || 1536,
      },
    };
  }

  /**
   * Clear all documents from the knowledge base
   */
  async clear(): Promise<void> {
    await this.vectorStore.deleteByFilter({ knowledgeBaseId: this.config.id });
    this.documents.clear();
  }

  // Source loaders (stubs - would need real implementations)
  private async loadFile(path: string): Promise<string> {
    // In a real implementation, use fs.readFile
    throw new Error(`File loading not implemented: ${path}`);
  }

  private async loadUrl(url: string): Promise<string> {
    // In a real implementation, fetch and parse
    throw new Error(`URL loading not implemented: ${url}`);
  }

  private async loadGitHub(repo: string, branch?: string, path?: string): Promise<string> {
    throw new Error(`GitHub loading not implemented: ${repo}`);
  }

  private async loadNotion(pageId: string): Promise<string> {
    throw new Error(`Notion loading not implemented: ${pageId}`);
  }

  private async loadConfluence(spaceKey: string, pageId?: string): Promise<string> {
    throw new Error(`Confluence loading not implemented: ${spaceKey}`);
  }
}

/**
 * Create a knowledge base
 */
export function createKnowledgeBase(
  config: KnowledgeBaseConfig,
  vectorStore: VectorStore,
  embeddings: EmbeddingProvider,
  chunker: Chunker
): KnowledgeBase {
  return new KnowledgeBase(config, vectorStore, embeddings, chunker);
}
