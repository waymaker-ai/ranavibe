-- CoFounder Development Database Initialization
-- This script runs once when the PostgreSQL container is first created.

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ============================================================================
-- Cost Tracking
-- ============================================================================

CREATE TABLE IF NOT EXISTS cofounder_cost_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  input_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  total_tokens INTEGER NOT NULL DEFAULT 0,
  cost_usd DOUBLE PRECISION NOT NULL DEFAULT 0,
  session_id TEXT,
  user_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cost_records_created_at ON cofounder_cost_records (created_at);
CREATE INDEX IF NOT EXISTS idx_cost_records_provider ON cofounder_cost_records (provider);
CREATE INDEX IF NOT EXISTS idx_cost_records_session ON cofounder_cost_records (session_id);
CREATE INDEX IF NOT EXISTS idx_cost_records_user ON cofounder_cost_records (user_id);
CREATE INDEX IF NOT EXISTS idx_cost_records_metadata ON cofounder_cost_records USING gin (metadata);

-- ============================================================================
-- Vector Documents (for RAG / knowledge base)
-- ============================================================================

CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT,
  metadata JSONB DEFAULT '{}',
  embedding vector(1536),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS documents_metadata_idx ON documents USING gin (metadata);

-- Vector similarity search function (cosine distance)
CREATE OR REPLACE FUNCTION match_documents(
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
    documents.id,
    documents.content,
    documents.metadata,
    1 - (documents.embedding <=> query_embedding) as similarity
  FROM documents
  WHERE
    1 - (documents.embedding <=> query_embedding) > match_threshold
    AND (filter = '{}' OR documents.metadata @> filter)
  ORDER BY documents.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Hybrid search function (vector + full-text)
CREATE OR REPLACE FUNCTION hybrid_search_documents(
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
      documents.id,
      ts_rank(to_tsvector('english', documents.content), plainto_tsquery('english', query_text)) as rank
    FROM documents
    WHERE to_tsvector('english', documents.content) @@ plainto_tsquery('english', query_text)
      AND (filter = '{}' OR documents.metadata @> filter)
  ),
  vector_search AS (
    SELECT
      documents.id,
      1 - (documents.embedding <=> query_embedding) as rank
    FROM documents
    WHERE (filter = '{}' OR documents.metadata @> filter)
  )
  SELECT
    d.id,
    d.content,
    d.metadata,
    (COALESCE(ts.rank, 0) * text_weight + COALESCE(vs.rank, 0) * vector_weight) as similarity,
    COALESCE(ts.rank, 0) as text_rank,
    COALESCE(vs.rank, 0) as vector_rank
  FROM documents d
  LEFT JOIN text_search ts ON d.id = ts.id
  LEFT JOIN vector_search vs ON d.id = vs.id
  WHERE ts.rank IS NOT NULL OR vs.rank IS NOT NULL
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;

-- ============================================================================
-- GDPR Compliance Tables
-- ============================================================================

CREATE TABLE IF NOT EXISTS consent_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  consent_type TEXT NOT NULL,
  granted BOOLEAN NOT NULL DEFAULT false,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_consent_user ON consent_log (user_id);

CREATE TABLE IF NOT EXISTS deletion_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  request_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deletion_user ON deletion_log (user_id);
CREATE INDEX IF NOT EXISTS idx_deletion_status ON deletion_log (status);

-- ============================================================================
-- Row-Level Security (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE cofounder_cost_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE deletion_log ENABLE ROW LEVEL SECURITY;

-- Cost records: users can only see their own records
CREATE POLICY cost_records_select_own ON cofounder_cost_records
  FOR SELECT USING (user_id = current_setting('app.current_user_id', true));

CREATE POLICY cost_records_insert_own ON cofounder_cost_records
  FOR INSERT WITH CHECK (user_id = current_setting('app.current_user_id', true));

-- Documents: authenticated users can read, service role can write
CREATE POLICY documents_select_authenticated ON documents
  FOR SELECT TO authenticated USING (true);

CREATE POLICY documents_insert_service ON documents
  FOR INSERT TO service_role WITH CHECK (true);

CREATE POLICY documents_update_service ON documents
  FOR UPDATE TO service_role USING (true);

CREATE POLICY documents_delete_service ON documents
  FOR DELETE TO service_role USING (true);

-- Consent log: users can only see their own consent records
CREATE POLICY consent_select_own ON consent_log
  FOR SELECT USING (user_id = current_setting('app.current_user_id', true));

CREATE POLICY consent_insert_own ON consent_log
  FOR INSERT WITH CHECK (user_id = current_setting('app.current_user_id', true));

-- Deletion log: users can see their own deletion requests
CREATE POLICY deletion_select_own ON deletion_log
  FOR SELECT USING (user_id = current_setting('app.current_user_id', true));

CREATE POLICY deletion_insert_own ON deletion_log
  FOR INSERT WITH CHECK (user_id = current_setting('app.current_user_id', true));

-- Service role bypasses RLS for admin operations
GRANT ALL ON cofounder_cost_records TO service_role;
GRANT ALL ON documents TO service_role;
GRANT ALL ON consent_log TO service_role;
GRANT ALL ON deletion_log TO service_role;

-- Authenticated users get restricted access
GRANT SELECT, INSERT ON cofounder_cost_records TO authenticated;
GRANT SELECT ON documents TO authenticated;
GRANT SELECT, INSERT ON consent_log TO authenticated;
GRANT SELECT, INSERT ON deletion_log TO authenticated;
