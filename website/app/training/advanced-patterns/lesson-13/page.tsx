import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'RAG Implementation Patterns | Advanced Patterns',
  description: 'Build RAG systems with pgvector, embedding generation, hybrid search, chunking strategies, and context window management.',
};

export default function Lesson13Page() {
  return (
    <div className="py-12 md:py-20">
      <div className="container-narrow">
        <div className="flex items-center justify-between mb-8">
          <Link href="/training/advanced-patterns" className="inline-flex items-center text-foreground-secondary hover:text-foreground transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Course
          </Link>
          <span className="text-sm text-foreground-secondary">Lesson 13 of 15</span>
        </div>

        <article className="prose prose-lg max-w-none">
          <h1>RAG Implementation Patterns</h1>
          <p className="lead">
            Retrieval-Augmented Generation grounds your agent&apos;s responses in real data. Instead of relying solely on the model&apos;s training data, RAG retrieves relevant documents and includes them in the prompt context. This lesson covers the full RAG pipeline using Supabase with pgvector, from document ingestion to context-aware generation.
          </p>

          <h2>pgvector Setup with Supabase</h2>
          <p>
            Supabase provides PostgreSQL with the pgvector extension, giving you a production-ready vector database without additional infrastructure. pgvector stores embeddings as native PostgreSQL columns and supports efficient similarity search with HNSW and IVFFlat indexes.
          </p>
          <div className="code-block"><pre><code>{`-- Enable pgvector extension
create extension if not exists vector;

-- Create documents table with embedding column
create table documents (
  id uuid default gen_random_uuid() primary key,
  content text not null,
  metadata jsonb default '{}',
  embedding vector(1536), -- OpenAI ada-002 dimensions
  created_at timestamptz default now()
);

-- Create HNSW index for fast similarity search
create index on documents
  using hnsw (embedding vector_cosine_ops)
  with (m = 16, ef_construction = 64);

-- Similarity search function
create or replace function match_documents(
  query_embedding vector(1536),
  match_threshold float default 0.7,
  match_count int default 5
) returns table (id uuid, content text, metadata jsonb, similarity float)
language sql stable as $$
  select id, content, metadata,
    1 - (embedding <=> query_embedding) as similarity
  from documents
  where 1 - (embedding <=> query_embedding) > match_threshold
  order by embedding <=> query_embedding
  limit match_count;
$$;`}</code></pre></div>

          <h2>Embedding Generation and Document Ingestion</h2>
          <p>
            Before documents can be searched, they must be converted to embeddings. CoFounder provides an ingestion pipeline that handles chunking, embedding generation, and storage in a single operation.
          </p>
          <div className="code-block"><pre><code>{`import { createEmbeddings, DocumentIngester } from '@waymakerai/aicofounder-core';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);

const ingester = new DocumentIngester({
  embeddingModel: 'text-embedding-3-small',
  store: supabase,
  table: 'documents',
  chunking: {
    strategy: 'recursive',  // Split by paragraphs, then sentences
    maxChunkSize: 500,       // Tokens per chunk
    overlap: 50,             // Token overlap between chunks
  },
});

// Ingest a document
await ingester.ingest({
  content: longDocumentText,
  metadata: { source: 'docs', category: 'api-reference' },
});

// Ingest from URL
await ingester.ingestUrl('https://docs.example.com/api', {
  metadata: { source: 'web' },
  selector: 'article',  // CSS selector for content extraction
});`}</code></pre></div>

          <h2>Hybrid Search</h2>
          <p>
            Pure vector search sometimes misses results that contain exact keyword matches, while pure keyword search misses semantically similar content. Hybrid search combines both approaches: use pgvector for semantic similarity and PostgreSQL&apos;s full-text search for keyword matching, then merge the results with reciprocal rank fusion.
          </p>
          <p>
            CoFounder&apos;s RAG module implements hybrid search out of the box. It runs both searches in parallel and combines the results using a configurable weighting. For most applications, a 70/30 split favoring semantic search produces the best results, but technical documentation often benefits from higher keyword weight.
          </p>

          <h2>Chunking Strategies</h2>
          <p>
            How you split documents into chunks dramatically affects retrieval quality. Too small and you lose context. Too large and you waste context window space with irrelevant content. CoFounder supports multiple chunking strategies: fixed-size (simple but breaks mid-sentence), recursive (splits by paragraph, then sentence), semantic (groups related sentences using embeddings), and document-aware (respects headers, code blocks, and list structures).
          </p>

          <h2>Context Window Management</h2>
          <p>
            After retrieval, you need to fit the relevant chunks into the LLM&apos;s context window alongside the system prompt, conversation history, and user query. CoFounder&apos;s context manager prioritizes chunks by relevance score, deduplicates overlapping content, and truncates intelligently to maximize the information density within your token budget. It also tracks which chunks were included so you can cite sources in the agent&apos;s response.
          </p>
        </article>

        <div className="flex items-center justify-between mt-12 pt-8 border-t border-border">
          <Link href="/training/advanced-patterns/lesson-12" className="text-foreground-secondary hover:text-foreground transition-colors text-sm">
            ← Previous: Building a Multi-Model Router
          </Link>
          <Link href="/training/advanced-patterns/lesson-14" className="btn-primary px-6 py-3 group">
            Next: Semantic Caching
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </div>
  );
}
