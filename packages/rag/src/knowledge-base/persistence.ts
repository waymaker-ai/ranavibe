/**
 * Document Persistence Layer
 * Persist document metadata alongside vector embeddings
 */

import type { KBDocument, KBStats } from './types';

/**
 * Document store interface
 */
export interface DocumentStore {
  /** Save a document */
  save(document: KBDocument): Promise<void>;
  /** Get a document by ID */
  get(id: string): Promise<KBDocument | null>;
  /** Update a document */
  update(id: string, updates: Partial<KBDocument>): Promise<KBDocument | null>;
  /** Delete a document */
  delete(id: string): Promise<boolean>;
  /** List documents with optional filters */
  list(options?: ListOptions): Promise<KBDocument[]>;
  /** Count documents */
  count(filter?: Record<string, unknown>): Promise<number>;
  /** Check if document exists */
  exists(id: string): Promise<boolean>;
  /** Batch save documents */
  saveBatch(documents: KBDocument[]): Promise<void>;
  /** Batch delete documents */
  deleteBatch(ids: string[]): Promise<number>;
}

export interface ListOptions {
  /** Maximum number to return */
  limit?: number;
  /** Offset for pagination */
  offset?: number;
  /** Filter by tags */
  tags?: string[];
  /** Filter by type */
  type?: string;
  /** Filter by status */
  status?: string;
  /** Filter by metadata */
  metadata?: Record<string, unknown>;
  /** Sort field */
  sortBy?: 'createdAt' | 'updatedAt' | 'title';
  /** Sort order */
  sortOrder?: 'asc' | 'desc';
}

/**
 * In-memory document store (for development/testing)
 */
export class MemoryDocumentStore implements DocumentStore {
  private documents = new Map<string, KBDocument>();

  async save(document: KBDocument): Promise<void> {
    this.documents.set(document.id, {
      ...document,
      createdAt: document.createdAt || new Date(),
      updatedAt: new Date(),
    });
  }

  async get(id: string): Promise<KBDocument | null> {
    return this.documents.get(id) || null;
  }

  async update(id: string, updates: Partial<KBDocument>): Promise<KBDocument | null> {
    const existing = this.documents.get(id);
    if (!existing) return null;

    const updated: KBDocument = {
      ...existing,
      ...updates,
      id, // Preserve ID
      createdAt: existing.createdAt, // Preserve creation date
      updatedAt: new Date(),
    };

    this.documents.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    return this.documents.delete(id);
  }

  async list(options?: ListOptions): Promise<KBDocument[]> {
    let docs = Array.from(this.documents.values());

    // Apply filters
    if (options?.tags?.length) {
      docs = docs.filter((d) => d.tags?.some((t) => options.tags!.includes(t)));
    }

    if (options?.type) {
      docs = docs.filter((d) => d.type === options.type);
    }

    if (options?.metadata) {
      docs = docs.filter((d) => {
        for (const [key, value] of Object.entries(options.metadata!)) {
          if (d.metadata?.[key] !== value) return false;
        }
        return true;
      });
    }

    // Sort
    if (options?.sortBy) {
      const order = options.sortOrder === 'desc' ? -1 : 1;
      docs.sort((a, b) => {
        const aVal = a[options.sortBy!];
        const bVal = b[options.sortBy!];
        if (aVal instanceof Date && bVal instanceof Date) {
          return (aVal.getTime() - bVal.getTime()) * order;
        }
        return String(aVal || '').localeCompare(String(bVal || '')) * order;
      });
    }

    // Pagination
    const offset = options?.offset || 0;
    const limit = options?.limit || 100;

    return docs.slice(offset, offset + limit);
  }

  async count(filter?: Record<string, unknown>): Promise<number> {
    if (!filter) return this.documents.size;

    let count = 0;
    for (const doc of this.documents.values()) {
      let matches = true;
      for (const [key, value] of Object.entries(filter)) {
        if (doc.metadata?.[key] !== value) {
          matches = false;
          break;
        }
      }
      if (matches) count++;
    }
    return count;
  }

  async exists(id: string): Promise<boolean> {
    return this.documents.has(id);
  }

  async saveBatch(documents: KBDocument[]): Promise<void> {
    for (const doc of documents) {
      await this.save(doc);
    }
  }

  async deleteBatch(ids: string[]): Promise<number> {
    let deleted = 0;
    for (const id of ids) {
      if (this.documents.delete(id)) deleted++;
    }
    return deleted;
  }

  /** Clear all documents */
  clear(): void {
    this.documents.clear();
  }
}

/**
 * Supabase document store
 */
export class SupabaseDocumentStore implements DocumentStore {
  private tableName: string;
  private client: any;

  constructor(config: {
    url: string;
    serviceKey: string;
    tableName?: string;
  }) {
    this.tableName = config.tableName || 'kb_documents';
    this.initClient(config.url, config.serviceKey);
  }

  private async initClient(url: string, serviceKey: string): Promise<void> {
    const { createClient } = await import('@supabase/supabase-js');
    this.client = createClient(url, serviceKey);
  }

  private async getClient(): Promise<any> {
    if (!this.client) {
      throw new Error('Supabase client not initialized');
    }
    return this.client;
  }

  async save(document: KBDocument): Promise<void> {
    const client = await this.getClient();
    const { error } = await client.from(this.tableName).upsert({
      id: document.id,
      content: document.content,
      title: document.title,
      url: document.url,
      type: document.type,
      access: document.access,
      tags: document.tags,
      metadata: document.metadata,
      created_at: document.createdAt?.toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (error) throw new Error(`Failed to save document: ${error.message}`);
  }

  async get(id: string): Promise<KBDocument | null> {
    const client = await this.getClient();
    const { data, error } = await client
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new Error(`Failed to get document: ${error.message}`);
    }

    return this.rowToDocument(data);
  }

  async update(id: string, updates: Partial<KBDocument>): Promise<KBDocument | null> {
    const client = await this.getClient();

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (updates.content !== undefined) updateData.content = updates.content;
    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.url !== undefined) updateData.url = updates.url;
    if (updates.type !== undefined) updateData.type = updates.type;
    if (updates.access !== undefined) updateData.access = updates.access;
    if (updates.tags !== undefined) updateData.tags = updates.tags;
    if (updates.metadata !== undefined) updateData.metadata = updates.metadata;

    const { data, error } = await client
      .from(this.tableName)
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to update document: ${error.message}`);
    }

    return this.rowToDocument(data);
  }

  async delete(id: string): Promise<boolean> {
    const client = await this.getClient();
    const { error, count } = await client
      .from(this.tableName)
      .delete()
      .eq('id', id);

    if (error) throw new Error(`Failed to delete document: ${error.message}`);
    return (count || 0) > 0;
  }

  async list(options?: ListOptions): Promise<KBDocument[]> {
    const client = await this.getClient();
    let query = client.from(this.tableName).select('*');

    if (options?.tags?.length) {
      query = query.overlaps('tags', options.tags);
    }

    if (options?.type) {
      query = query.eq('type', options.type);
    }

    if (options?.sortBy) {
      const column =
        options.sortBy === 'createdAt'
          ? 'created_at'
          : options.sortBy === 'updatedAt'
            ? 'updated_at'
            : options.sortBy;
      query = query.order(column, { ascending: options.sortOrder !== 'desc' });
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 100) - 1);
    }

    const { data, error } = await query;

    if (error) throw new Error(`Failed to list documents: ${error.message}`);
    return (data || []).map(this.rowToDocument);
  }

  async count(filter?: Record<string, unknown>): Promise<number> {
    const client = await this.getClient();
    let query = client
      .from(this.tableName)
      .select('*', { count: 'exact', head: true });

    if (filter) {
      for (const [key, value] of Object.entries(filter)) {
        query = query.eq(key, value);
      }
    }

    const { count, error } = await query;

    if (error) throw new Error(`Failed to count documents: ${error.message}`);
    return count || 0;
  }

  async exists(id: string): Promise<boolean> {
    const client = await this.getClient();
    const { count, error } = await client
      .from(this.tableName)
      .select('*', { count: 'exact', head: true })
      .eq('id', id);

    if (error) throw new Error(`Failed to check existence: ${error.message}`);
    return (count || 0) > 0;
  }

  async saveBatch(documents: KBDocument[]): Promise<void> {
    const client = await this.getClient();
    const rows = documents.map((doc) => ({
      id: doc.id,
      content: doc.content,
      title: doc.title,
      url: doc.url,
      type: doc.type,
      access: doc.access,
      tags: doc.tags,
      metadata: doc.metadata,
      created_at: doc.createdAt?.toISOString() || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    const { error } = await client.from(this.tableName).upsert(rows);

    if (error) throw new Error(`Failed to save batch: ${error.message}`);
  }

  async deleteBatch(ids: string[]): Promise<number> {
    const client = await this.getClient();
    const { error, count } = await client
      .from(this.tableName)
      .delete()
      .in('id', ids);

    if (error) throw new Error(`Failed to delete batch: ${error.message}`);
    return count || 0;
  }

  private rowToDocument(row: any): KBDocument {
    return {
      id: row.id,
      content: row.content,
      title: row.title,
      url: row.url,
      type: row.type,
      access: row.access,
      tags: row.tags,
      metadata: row.metadata,
      createdAt: row.created_at ? new Date(row.created_at) : undefined,
      updatedAt: row.updated_at ? new Date(row.updated_at) : undefined,
    };
  }
}

/**
 * SQL to create the document store table
 */
export const DOCUMENT_STORE_SQL = `
-- Create the documents table
create table if not exists kb_documents (
  id text primary key,
  content text not null,
  title text,
  url text,
  type text,
  access text default 'public',
  tags text[] default '{}',
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Index for tag filtering
create index if not exists kb_documents_tags_idx
on kb_documents using gin (tags);

-- Index for metadata filtering
create index if not exists kb_documents_metadata_idx
on kb_documents using gin (metadata);

-- Index for type filtering
create index if not exists kb_documents_type_idx
on kb_documents (type);

-- Updated at trigger
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_kb_documents_updated_at
  before update on kb_documents
  for each row
  execute function update_updated_at_column();
`;

/**
 * Create a document store
 */
export function createDocumentStore(
  type: 'memory' | 'supabase',
  config?: { url?: string; serviceKey?: string; tableName?: string }
): DocumentStore {
  switch (type) {
    case 'supabase':
      if (!config?.url || !config?.serviceKey) {
        throw new Error('Supabase URL and service key required');
      }
      return new SupabaseDocumentStore({
        url: config.url,
        serviceKey: config.serviceKey,
        tableName: config.tableName,
      });
    case 'memory':
    default:
      return new MemoryDocumentStore();
  }
}
