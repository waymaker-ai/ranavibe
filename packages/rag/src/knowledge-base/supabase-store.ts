/**
 * Supabase Vector Store
 * Integration with Supabase pgvector for knowledge base storage
 */

import type { Chunk } from '../types';
import type { VectorStore, EmbeddingProvider } from './knowledge-base';

export interface SupabaseVectorStoreConfig {
  /** Supabase URL */
  url: string;
  /** Supabase service key */
  serviceKey: string;
  /** Table name for vectors */
  table?: string;
  /** Content column name */
  contentColumn?: string;
  /** Embedding column name */
  embeddingColumn?: string;
  /** Metadata column name */
  metadataColumn?: string;
  /** Match function name */
  matchFunction?: string;
}

/**
 * Supabase Vector Store implementation
 */
export class SupabaseVectorStore implements VectorStore {
  private config: Required<SupabaseVectorStoreConfig>;
  private client: any; // SupabaseClient type

  constructor(config: SupabaseVectorStoreConfig) {
    this.config = {
      table: 'documents',
      contentColumn: 'content',
      embeddingColumn: 'embedding',
      metadataColumn: 'metadata',
      matchFunction: 'match_documents',
      ...config,
    };
  }

  /**
   * Initialize the Supabase client
   */
  private async getClient(): Promise<any> {
    if (this.client) return this.client;

    // Dynamic import to avoid bundling issues
    const { createClient } = await import('@supabase/supabase-js');
    this.client = createClient(this.config.url, this.config.serviceKey);
    return this.client;
  }

  /**
   * Upsert chunks into the vector store
   */
  async upsert(chunks: Chunk[]): Promise<void> {
    const client = await this.getClient();

    const records = chunks.map(chunk => ({
      id: chunk.id,
      [this.config.contentColumn]: chunk.content,
      [this.config.embeddingColumn]: chunk.embedding,
      [this.config.metadataColumn]: chunk.metadata,
    }));

    const { error } = await client
      .from(this.config.table)
      .upsert(records, { onConflict: 'id' });

    if (error) {
      throw new Error(`Failed to upsert chunks: ${error.message}`);
    }
  }

  /**
   * Search for similar vectors
   */
  async search(
    embedding: number[],
    options?: { limit?: number; filter?: Record<string, unknown> }
  ): Promise<Array<{ id: string; score: number; metadata: Record<string, unknown> }>> {
    const client = await this.getClient();
    const limit = options?.limit || 10;

    // Use the match function (RPC)
    const { data, error } = await client.rpc(this.config.matchFunction, {
      query_embedding: embedding,
      match_count: limit,
      filter: options?.filter || {},
    });

    if (error) {
      throw new Error(`Failed to search: ${error.message}`);
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      score: row.similarity || 1 - row.distance,
      metadata: {
        ...row[this.config.metadataColumn],
        content: row[this.config.contentColumn],
      },
    }));
  }

  /**
   * Delete chunks by IDs
   */
  async delete(ids: string[]): Promise<void> {
    const client = await this.getClient();

    const { error } = await client
      .from(this.config.table)
      .delete()
      .in('id', ids);

    if (error) {
      throw new Error(`Failed to delete chunks: ${error.message}`);
    }
  }

  /**
   * Delete chunks by filter
   */
  async deleteByFilter(filter: Record<string, unknown>): Promise<number> {
    const client = await this.getClient();

    // Build filter query
    let query = client.from(this.config.table).delete();

    for (const [key, value] of Object.entries(filter)) {
      if (key.includes('.')) {
        // JSON path filter
        query = query.filter(`${this.config.metadataColumn}->${key}`, 'eq', value);
      } else {
        query = query.filter(`${this.config.metadataColumn}->>${key}`, 'eq', value);
      }
    }

    const { data, error, count } = await query.select('id');

    if (error) {
      throw new Error(`Failed to delete by filter: ${error.message}`);
    }

    return count || data?.length || 0;
  }

  /**
   * Count chunks matching filter
   */
  async count(filter?: Record<string, unknown>): Promise<number> {
    const client = await this.getClient();

    let query = client
      .from(this.config.table)
      .select('*', { count: 'exact', head: true });

    if (filter) {
      for (const [key, value] of Object.entries(filter)) {
        query = query.filter(`${this.config.metadataColumn}->>${key}`, 'eq', value);
      }
    }

    const { count, error } = await query;

    if (error) {
      throw new Error(`Failed to count: ${error.message}`);
    }

    return count || 0;
  }
}

/**
 * Create a Supabase vector store
 */
export function createSupabaseVectorStore(
  config: SupabaseVectorStoreConfig
): SupabaseVectorStore {
  return new SupabaseVectorStore(config);
}

/**
 * SQL to create the required Supabase tables and functions
 */
export const SUPABASE_SETUP_SQL = `
-- Enable the pgvector extension
create extension if not exists vector;

-- Create the documents table
create table if not exists documents (
  id text primary key,
  content text not null,
  embedding vector(1536),
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default now()
);

-- Create an index for vector similarity search
create index if not exists documents_embedding_idx
on documents using ivfflat (embedding vector_cosine_ops)
with (lists = 100);

-- Create an index for metadata filtering
create index if not exists documents_metadata_idx
on documents using gin (metadata);

-- Create the match function
create or replace function match_documents (
  query_embedding vector(1536),
  match_count int default 10,
  filter jsonb default '{}'::jsonb
)
returns table (
  id text,
  content text,
  metadata jsonb,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    documents.id,
    documents.content,
    documents.metadata,
    1 - (documents.embedding <=> query_embedding) as similarity
  from documents
  where
    case
      when filter != '{}'::jsonb
      then documents.metadata @> filter
      else true
    end
  order by documents.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- Row Level Security (optional)
alter table documents enable row level security;

-- Policy for authenticated users (customize as needed)
create policy "Users can read all documents"
  on documents for select
  to authenticated
  using (true);

create policy "Users can insert documents"
  on documents for insert
  to authenticated
  with check (true);

create policy "Users can update own documents"
  on documents for update
  to authenticated
  using (metadata->>'owner' = auth.uid()::text);

create policy "Users can delete own documents"
  on documents for delete
  to authenticated
  using (metadata->>'owner' = auth.uid()::text);
`;
