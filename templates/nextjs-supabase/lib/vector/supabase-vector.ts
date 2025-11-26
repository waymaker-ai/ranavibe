/**
 * LUKA - Vector Database Integration (Supabase pgvector)
 * For RAG (Retrieval Augmented Generation) and semantic search
 */

import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Generate embeddings for text
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small', // $0.02 per 1M tokens
    input: text,
  });

  return response.data[0].embedding;
}

/**
 * Store document with vector embedding
 */
export async function storeDocument(document: {
  content: string;
  metadata?: Record<string, any>;
}) {
  const embedding = await generateEmbedding(document.content);

  const { data, error } = await supabase.from('documents').insert({
    content: document.content,
    embedding,
    metadata: document.metadata || {},
    created_at: new Date().toISOString(),
  }).select();

  if (error) throw error;
  return data[0];
}

/**
 * Semantic search using vector similarity
 */
export async function semanticSearch(query: string, limit: number = 5) {
  const queryEmbedding = await generateEmbedding(query);

  const { data, error } = await supabase.rpc('match_documents', {
    query_embedding: queryEmbedding,
    match_threshold: 0.78, // Similarity threshold (0-1)
    match_count: limit,
  });

  if (error) throw error;
  return data;
}

/**
 * RAG: Retrieve relevant context and generate answer
 */
export async function ragAnswer(
  question: string,
  model: 'gemini-2.0-flash-exp' | 'gpt-4o' | 'claude-3-5-sonnet-20241022' = 'gemini-2.0-flash-exp'
) {
  // Step 1: Retrieve relevant documents
  const relevantDocs = await semanticSearch(question, 5);

  if (relevantDocs.length === 0) {
    return {
      answer: "I don't have enough information to answer this question.",
      sources: [],
    };
  }

  // Step 2: Build context from retrieved documents
  const context = relevantDocs
    .map((doc: any) => `[Source ${doc.id}]: ${doc.content}`)
    .join('\n\n');

  // Step 3: Generate answer with context
  const { luka } = await import('../llm/unified-client');

  const response = await luka.chat({
    model,
    messages: [
      {
        role: 'system',
        content: 'You are a helpful assistant. Answer questions based on the provided context. Cite sources using [Source N] format. If the answer is not in the context, say so.',
      },
      {
        role: 'user',
        content: `Context:\n${context}\n\nQuestion: ${question}`,
      },
    ],
    temperature: 0.3,
  });

  return {
    answer: response.content,
    sources: relevantDocs.map((doc: any) => ({
      id: doc.id,
      content: doc.content,
      similarity: doc.similarity,
      metadata: doc.metadata,
    })),
    cost: response.cost,
  };
}

/**
 * Batch upload documents
 */
export async function batchUploadDocuments(documents: string[]) {
  const results = [];

  for (const doc of documents) {
    try {
      const result = await storeDocument({ content: doc });
      results.push(result);
    } catch (error) {
      console.error(`Failed to upload document: ${error}`);
      results.push({ error: error.message, content: doc.slice(0, 100) });
    }
  }

  return results;
}

/**
 * Update document embedding
 */
export async function updateDocumentEmbedding(documentId: number, newContent: string) {
  const embedding = await generateEmbedding(newContent);

  const { data, error } = await supabase
    .from('documents')
    .update({
      content: newContent,
      embedding,
      updated_at: new Date().toISOString(),
    })
    .eq('id', documentId)
    .select();

  if (error) throw error;
  return data[0];
}

/**
 * Delete document
 */
export async function deleteDocument(documentId: number) {
  const { error } = await supabase.from('documents').delete().eq('id', documentId);
  if (error) throw error;
}

/**
 * Search with filters
 */
export async function searchWithFilters(
  query: string,
  filters: Record<string, any>,
  limit: number = 5
) {
  const queryEmbedding = await generateEmbedding(query);

  let queryBuilder = supabase.rpc('match_documents', {
    query_embedding: queryEmbedding,
    match_threshold: 0.78,
    match_count: limit,
  });

  // Apply metadata filters
  for (const [key, value] of Object.entries(filters)) {
    queryBuilder = queryBuilder.filter(`metadata->>${key}`, 'eq', value);
  }

  const { data, error } = await queryBuilder;
  if (error) throw error;
  return data;
}

/**
 * SQL Migration for pgvector setup
 * Run this in Supabase SQL Editor:
 */
export const sqlMigration = `
-- Enable pgvector extension
create extension if not exists vector;

-- Create documents table
create table if not exists documents (
  id bigserial primary key,
  content text not null,
  embedding vector(1536), -- OpenAI text-embedding-3-small dimension
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create index for vector similarity search
create index on documents using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- Create function for similarity search
create or replace function match_documents (
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
returns table (
  id bigint,
  content text,
  metadata jsonb,
  similarity float
)
language sql stable
as $$
  select
    documents.id,
    documents.content,
    documents.metadata,
    1 - (documents.embedding <=> query_embedding) as similarity
  from documents
  where 1 - (documents.embedding <=> query_embedding) > match_threshold
  order by similarity desc
  limit match_count;
$$;

-- Create RLS policies
alter table documents enable row level security;

-- Allow authenticated users to read
create policy "Users can read documents"
  on documents for select
  to authenticated
  using (true);

-- Allow authenticated users to insert
create policy "Users can insert documents"
  on documents for insert
  to authenticated
  with check (true);

-- Create updated_at trigger
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_documents_updated_at
  before update on documents
  for each row
  execute function update_updated_at();
`;

/**
 * Example usage:
 */
export const exampleVectorUsage = `
// Store documents
await storeDocument({
  content: "LUKA is a Layered Utility Kit for AI that supports 9 LLM providers.",
  metadata: { category: "framework", version: "2.0" }
});

// Semantic search
const results = await semanticSearch("What LLM providers does LUKA support?");
console.log(results);

// RAG answer
const answer = await ragAnswer("How do I use Gemini 2.0 Flash with LUKA?");
console.log(answer.answer);
console.log(answer.sources);

// Search with filters
const filtered = await searchWithFilters(
  "framework features",
  { category: "framework", version: "2.0" }
);
`;
