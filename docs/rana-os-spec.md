# CoFounder OS Specification v1.0

> **CoFounder: Rapid AI Native Architecture**
> A full AI app + RAG + agent OS developers can live in.

## Overview

CoFounder is positioned at the intersection of:
- **LiteLLM** (gateway) - multi-provider routing, cost optimization
- **Makerkit/AnotherWrapper** (templates) - Next.js AI SaaS starters
- **LangChain/CrewAI** (orchestration) - agents, RAG, workflows

But with a much more integrated "production OS" lens including security, quality gates, and "vibecoding".

---

## Architecture Layers

```
┌─────────────────────────────────────────────────────────────┐
│                      App Layer                               │
│  Next.js + Supabase template, CLI, security, DX, deploy     │
├─────────────────────────────────────────────────────────────┤
│                     Agent Layer                              │
│  ADK, multi-agent orchestration, tools, memory, vibes       │
├─────────────────────────────────────────────────────────────┤
│                      RAG Layer                               │
│  Ingestion, chunking, embeddings, retrieval, reranking      │
├─────────────────────────────────────────────────────────────┤
│                     LLM Core                                 │
│  Multi-provider routing, cost/latency optimization,         │
│  security hooks, plugins, prompt & quality gates            │
└─────────────────────────────────────────────────────────────┘
```

---

## 1. @cofounder/rag - RAG Module (Enhanced)

### 1.1 Knowledge Base Management

```typescript
// packages/rag/src/knowledge-base/types.ts

export interface KnowledgeBase {
  id: string;
  orgId: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  isDefault?: boolean;
  settings?: KnowledgeBaseSettings;
}

export interface KnowledgeBaseSettings {
  chunkingStrategy: 'recursive' | 'semantic' | 'markdown' | 'code';
  maxChunkTokens: number;
  overlapTokens: number;
  embeddingProvider: string;
  embeddingModel: string;
  defaultTopK: number;
  rerankEnabled: boolean;
}

export type DocumentSourceType = 'file' | 'url' | 'text' | 'api' | 'notion' | 'gdrive' | 's3';

export interface DocumentSourceConfig {
  type: DocumentSourceType;
  reference: string;
  metadata?: Record<string, any>;
  credentials?: Record<string, string>;
}

export interface RawDocument {
  id: string;
  kbId: string;
  orgId: string;
  source: DocumentSourceConfig;
  mimeType: string;
  content: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface Chunk {
  id: string;
  kbId: string;
  orgId: string;
  documentId: string;
  content: string;
  embedding?: number[];
  position: number;
  metadata?: Record<string, any>;
  tokenCount: number;
}
```

### 1.2 RAG Client API

```typescript
// packages/rag/src/client.ts

import { RanaClient } from '@cofounder/core';

export interface RAGClientConfig {
  cofounder: RanaClient;
  defaultChunking?: ChunkingConfig;
  defaultEmbeddings?: EmbeddingConfig;
  defaultRetrieval?: RetrievalConfig;
  db: RAGDatabaseAdapter;
}

export interface RAGDatabaseAdapter {
  // Knowledge Base CRUD
  createKnowledgeBase(kb: Partial<KnowledgeBase>): Promise<KnowledgeBase>;
  getKnowledgeBase(id: string, orgId: string): Promise<KnowledgeBase | null>;
  listKnowledgeBases(orgId: string): Promise<KnowledgeBase[]>;
  deleteKnowledgeBase(id: string, orgId: string): Promise<void>;

  // Document operations
  saveDocuments(docs: RawDocument[]): Promise<void>;
  getDocuments(kbId: string, orgId: string): Promise<RawDocument[]>;
  deleteDocument(id: string, orgId: string): Promise<void>;

  // Chunk operations
  saveChunks(chunks: Chunk[]): Promise<void>;
  queryChunks(
    kbId: string,
    orgId: string,
    embedding: number[],
    config: RetrievalConfig
  ): Promise<Chunk[]>;
  deleteChunks(documentId: string): Promise<void>;
}

export class RAGClient {
  private cofounder: RanaClient;
  private cfg: RAGClientConfig;

  constructor(config: RAGClientConfig) {
    this.cfg = config;
    this.cofounder = config.cofounder;
  }

  async createKnowledgeBase(input: {
    orgId: string;
    name: string;
    description?: string;
    settings?: Partial<KnowledgeBaseSettings>;
  }): Promise<KnowledgeBase> {
    return this.cfg.db.createKnowledgeBase({
      orgId: input.orgId,
      name: input.name,
      description: input.description,
      settings: {
        chunkingStrategy: 'recursive',
        maxChunkTokens: 512,
        overlapTokens: 64,
        embeddingProvider: 'openai',
        embeddingModel: 'text-embedding-3-large',
        defaultTopK: 8,
        rerankEnabled: true,
        ...input.settings,
      },
    });
  }

  async ingestDocuments(params: {
    kbId: string;
    orgId: string;
    sources: DocumentSourceConfig[];
    chunking?: ChunkingConfig;
    embeddings?: EmbeddingConfig;
  }): Promise<{ documents: RawDocument[]; chunks: Chunk[] }> {
    // Implementation:
    // 1. Fetch & normalize content from sources
    // 2. Chunk using configured strategy
    // 3. Generate embeddings via CoFounder core
    // 4. Save documents & chunks via db adapter
  }

  async ask(req: AskRequest): Promise<AskResult> {
    // Implementation:
    // 1. Embed query via CoFounder core
    // 2. Query chunks using db adapter
    // 3. Optionally rerank results
    // 4. Build context + system prompt
    // 5. Call cofounder.chat(...) for synthesis
    // 6. Return answer + citations + usage
  }

  async search(req: SearchRequest): Promise<SearchResult[]> {
    // Pure retrieval without synthesis
  }
}

export interface AskRequest {
  kbId: string;
  orgId: string;
  query: string;
  mode?: 'qa' | 'chat';
  llmProvider?: string;
  llmModel?: string;
  maxTokens?: number;
  temperature?: number;
  retrieval?: Partial<RetrievalConfig>;
  userId?: string;
  vibe?: VibeSpec; // Apply vibe constraints
  metadata?: Record<string, any>;
}

export interface AskResult {
  answer: string;
  citations: Citation[];
  usage?: {
    tokensPrompt: number;
    tokensCompletion: number;
    costUsd: number;
    provider: string;
    model: string;
  };
}

export interface Citation {
  chunkId: string;
  documentId: string;
  score: number;
  snippet: string;
  metadata?: Record<string, any>;
}
```

### 1.3 Supabase pgvector Adapter

```typescript
// packages/rag/src/adapters/supabase.ts

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { RAGDatabaseAdapter, KnowledgeBase, RawDocument, Chunk } from '../types';

export interface SupabaseRAGConfig {
  url: string;
  anonKey: string;
  serviceRoleKey?: string;
}

export function createSupabaseRAGAdapter(config: SupabaseRAGConfig): RAGDatabaseAdapter {
  const client = createClient(config.url, config.serviceRoleKey || config.anonKey);

  return {
    async createKnowledgeBase(kb) {
      const { data, error } = await client
        .from('knowledge_bases')
        .insert(kb)
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    async queryChunks(kbId, orgId, embedding, config) {
      const { data, error } = await client.rpc('match_chunks', {
        query_embedding: embedding,
        match_kb_id: kbId,
        match_org_id: orgId,
        match_count: config.topK,
        match_threshold: config.scoreThreshold ?? 0.7,
      });
      if (error) throw error;
      return data;
    },

    // ... other methods
  };
}

// SQL for Supabase setup
export const SUPABASE_RAG_SETUP_SQL = `
-- Enable pgvector
create extension if not exists vector;

-- Knowledge bases table
create table knowledge_bases (
  id uuid primary key default gen_random_uuid(),
  org_id text not null,
  name text not null,
  description text,
  settings jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS for knowledge bases
alter table knowledge_bases enable row level security;
create policy "org_access" on knowledge_bases
  for all using (org_id = current_setting('app.current_org_id', true));

-- Documents table
create table documents (
  id uuid primary key default gen_random_uuid(),
  kb_id uuid references knowledge_bases(id) on delete cascade,
  org_id text not null,
  source jsonb not null,
  mime_type text,
  content text,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

-- Chunks table with vector
create table chunks (
  id uuid primary key default gen_random_uuid(),
  kb_id uuid references knowledge_bases(id) on delete cascade,
  org_id text not null,
  document_id uuid references documents(id) on delete cascade,
  content text not null,
  embedding vector(1536),
  position integer,
  token_count integer,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

-- Vector similarity search index
create index on chunks using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- RLS for chunks
alter table chunks enable row level security;
create policy "org_access" on chunks
  for all using (org_id = current_setting('app.current_org_id', true));

-- Match function
create or replace function match_chunks(
  query_embedding vector(1536),
  match_kb_id uuid,
  match_org_id text,
  match_count int default 10,
  match_threshold float default 0.7
)
returns table (
  id uuid,
  kb_id uuid,
  document_id uuid,
  content text,
  metadata jsonb,
  similarity float
)
language sql stable
as $$
  select
    chunks.id,
    chunks.kb_id,
    chunks.document_id,
    chunks.content,
    chunks.metadata,
    1 - (chunks.embedding <=> query_embedding) as similarity
  from chunks
  where chunks.kb_id = match_kb_id
    and chunks.org_id = match_org_id
    and 1 - (chunks.embedding <=> query_embedding) > match_threshold
  order by chunks.embedding <=> query_embedding
  limit match_count;
$$;
`;
```

---

## 2. @cofounder/agents - Agent Development Kit (ADK)

### 2.1 Core Types

```typescript
// packages/agents/src/types.ts

import { RanaClient } from '@cofounder/core';
import { RAGClient } from '@cofounder/rag';

export interface UserIdentity {
  id: string;
  orgId: string;
  roles: string[];
  email?: string;
  name?: string;
}

export interface VibeConfig {
  id: string;
  name: string;
  description?: string;
  tone?: string;
  constraints?: string[];
  allowedActions?: string[];
  disallowedActions?: string[];
}

export interface ToolContext {
  user: UserIdentity;
  orgId: string;
  metadata?: Record<string, any>;
}

export interface ToolInput {
  [key: string]: any;
}

export interface ToolResult {
  ok: boolean;
  data?: any;
  error?: string;
}

export interface Tool {
  name: string;
  description: string;
  inputSchema?: Record<string, any>;
  // Safety metadata
  requiresAuth?: boolean;
  sideEffects?: boolean;
  rateLimit?: { requests: number; windowMs: number };
  run(input: ToolInput, ctx: ToolContext): Promise<ToolResult>;
}

export interface MemoryStore {
  get(key: string): Promise<any | null>;
  set(key: string, value: any, ttlSeconds?: number): Promise<void>;
  append?(key: string, value: any): Promise<void>;
  delete?(key: string): Promise<void>;
}

export interface AgentInput {
  id?: string;
  user: UserIdentity;
  message: string;
  context?: Record<string, any>;
  conversationHistory?: AgentMessage[];
}

export interface AgentMessage {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  toolCalls?: ToolCallRecord[];
  timestamp?: Date;
}

export interface ToolCallRecord {
  tool: string;
  input: ToolInput;
  result: ToolResult;
  durationMs: number;
}

export interface AgentOutput {
  id: string;
  messages: AgentMessage[];
  usedTools?: ToolCallRecord[];
  citations?: any[];
  metadata?: Record<string, any>;
  usage?: {
    tokensPrompt: number;
    tokensCompletion: number;
    costUsd: number;
    totalDurationMs: number;
  };
}

export interface AgentContext {
  cofounder: RanaClient;
  rag?: RAGClient;
  tools: Tool[];
  memory?: MemoryStore;
  vibe?: VibeConfig;
  logger?: (event: string, payload: any) => void;
  user: UserIdentity;
}
```

### 2.2 BaseAgent

```typescript
// packages/agents/src/base-agent.ts

import { AgentInput, AgentOutput, AgentContext, AgentMessage, Tool, ToolResult } from './types';
import { compileVibe } from './vibe-spec';

export abstract class BaseAgent {
  abstract id: string;
  abstract name: string;
  abstract description?: string;

  protected ctx: AgentContext;

  constructor(ctx: AgentContext) {
    this.ctx = ctx;
  }

  abstract handle(input: AgentInput): Promise<AgentOutput>;

  protected log(event: string, payload: any) {
    this.ctx.logger?.(event, { agentId: this.id, ...payload });
  }

  protected async callTool(tool: Tool, input: any): Promise<ToolResult> {
    const start = Date.now();

    // Check if tool is allowed by vibe
    if (this.ctx.vibe?.disallowedActions?.includes(tool.name)) {
      return { ok: false, error: `Tool ${tool.name} is not allowed by current vibe` };
    }

    // Check auth requirements
    if (tool.requiresAuth && !this.ctx.user) {
      return { ok: false, error: `Tool ${tool.name} requires authentication` };
    }

    try {
      const result = await tool.run(input, {
        user: this.ctx.user,
        orgId: this.ctx.user.orgId,
      });

      this.log('tool:call', {
        tool: tool.name,
        input,
        result,
        durationMs: Date.now() - start,
      });

      return result;
    } catch (error) {
      return { ok: false, error: String(error) };
    }
  }

  protected buildSystemPrompt(): string {
    if (this.ctx.vibe) {
      return compileVibe(this.ctx.vibe).systemPrompt;
    }
    return `You are ${this.name}. ${this.description || ''}`;
  }
}
```

### 2.3 LLM Agent with Tool Use

```typescript
// packages/agents/src/llm-agent.ts

import { BaseAgent } from './base-agent';
import { AgentInput, AgentOutput, AgentMessage, Tool } from './types';

export interface LLMAgentConfig {
  maxIterations?: number;
  provider?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export class LLMAgent extends BaseAgent {
  id: string;
  name: string;
  description?: string;

  private config: LLMAgentConfig;

  constructor(
    ctx: AgentContext,
    id: string,
    name: string,
    description?: string,
    config: LLMAgentConfig = {}
  ) {
    super(ctx);
    this.id = id;
    this.name = name;
    this.description = description;
    this.config = {
      maxIterations: 10,
      temperature: 0.7,
      ...config,
    };
  }

  async handle(input: AgentInput): Promise<AgentOutput> {
    const start = Date.now();
    const messages: AgentMessage[] = [
      { role: 'system', content: this.buildSystemPrompt() },
      ...(input.conversationHistory || []),
      { role: 'user', content: input.message },
    ];

    const usedTools: ToolCallRecord[] = [];
    let iterations = 0;

    while (iterations < this.config.maxIterations!) {
      iterations++;

      const response = await this.ctx.cofounder.chat({
        messages: messages.map(m => ({ role: m.role as any, content: m.content })),
        tools: this.ctx.tools.map(t => ({
          type: 'function',
          function: {
            name: t.name,
            description: t.description,
            parameters: t.inputSchema || {},
          },
        })),
        provider: this.config.provider,
        model: this.config.model,
        temperature: this.config.temperature,
        maxTokens: this.config.maxTokens,
      });

      // If no tool calls, we're done
      if (!response.toolCalls?.length) {
        messages.push({
          role: 'assistant',
          content: response.content,
          timestamp: new Date(),
        });

        return {
          id: `${this.id}:${Date.now()}`,
          messages,
          usedTools,
          metadata: {
            iterations,
            totalDurationMs: Date.now() - start,
          },
          usage: response.usage,
        };
      }

      // Process tool calls
      for (const toolCall of response.toolCalls) {
        const tool = this.ctx.tools.find(t => t.name === toolCall.function.name);
        if (!tool) {
          continue;
        }

        const toolStart = Date.now();
        const result = await this.callTool(tool, JSON.parse(toolCall.function.arguments));

        usedTools.push({
          tool: tool.name,
          input: JSON.parse(toolCall.function.arguments),
          result,
          durationMs: Date.now() - toolStart,
        });

        messages.push({
          role: 'tool',
          content: JSON.stringify(result),
          toolCalls: [{ tool: tool.name, input: toolCall.function.arguments, result, durationMs: Date.now() - toolStart }],
        });
      }
    }

    // Max iterations reached
    return {
      id: `${this.id}:${Date.now()}`,
      messages,
      usedTools,
      metadata: {
        iterations,
        maxIterationsReached: true,
        totalDurationMs: Date.now() - start,
      },
    };
  }
}

export function createAgent(
  ctx: AgentContext,
  config: {
    id: string;
    name: string;
    description?: string;
    llmConfig?: LLMAgentConfig;
  }
): LLMAgent {
  return new LLMAgent(ctx, config.id, config.name, config.description, config.llmConfig);
}
```

### 2.4 RAG QA Agent

```typescript
// packages/agents/src/presets/rag-qa-agent.ts

import { BaseAgent } from '../base-agent';
import { AgentInput, AgentOutput, AgentContext } from '../types';

export class RagQAAgent extends BaseAgent {
  id = 'rag_qa';
  name = 'RAG QA Agent';
  description = 'Answers questions using knowledge base retrieval';

  async handle(input: AgentInput): Promise<AgentOutput> {
    if (!this.ctx.rag) {
      throw new Error('RAG client not configured for RagQAAgent');
    }

    const kbId = input.context?.kbId;
    if (!kbId) {
      throw new Error('kbId is required in context');
    }

    this.log('rag_qa:start', { kbId, query: input.message });

    const result = await this.ctx.rag.ask({
      kbId,
      orgId: input.user.orgId,
      query: input.message,
      mode: 'qa',
      userId: input.user.id,
      vibe: this.ctx.vibe,
    });

    this.log('rag_qa:answer', {
      kbId,
      answer: result.answer.substring(0, 100),
      citationCount: result.citations.length,
    });

    return {
      id: `${this.id}:${Date.now()}`,
      messages: [
        {
          role: 'assistant',
          content: result.answer,
        },
      ],
      citations: result.citations,
      metadata: { usage: result.usage },
    };
  }
}

export function createRagQAAgent(ctx: AgentContext): RagQAAgent {
  return new RagQAAgent(ctx);
}
```

---

## 3. VibeSpec - Declarative Agent Configuration

### 3.1 YAML Schema

```yaml
# config/vibes/customer_support.yml
id: customer_support_eu
name: "EU Customer Support Assistant"
description: >
  Handles EU customer questions about orders, shipping, and refunds.
  Never invents policies or numbers.

vibe:
  tone: "calm, factual, friendly"
  constraints:
    - "Never invent policies or numbers."
    - "Only answer using documents from kb:policies_eu."
    - "If unsure, escalate to human support."
    - "Always provide citation for policy answers."
  allowedActions:
    - "escalate_to_human"
    - "create_ticket"
    - "lookup_order"
  disallowedActions:
    - "issue_refund"
    - "modify_billing"
    - "delete_account"

rag:
  kbId: "policies_eu"
  topK: 6
  rerank: true
  filters:
    region: "EU"

llm:
  provider: "anthropic"
  model: "claude-3-5-sonnet-20241022"
  temperature: 0.1
  maxTokens: 800

security:
  piiRedaction: true
  promptInjectionDetection: true
  maxToolCalls: 5

eval:
  successCriteria:
    - "No refund amounts are invented."
    - "Every policy answer references at least one citation."
  blockedPatterns:
    - "As an AI, I cannot access your account"
    - "ignore previous instructions"
    - "pretend you are"
```

### 3.2 TypeScript Types

```typescript
// packages/core/src/vibe-spec/types.ts

export interface VibeSpec {
  id: string;
  name: string;
  description?: string;

  vibe?: {
    tone?: string;
    constraints?: string[];
    allowedActions?: string[];
    disallowedActions?: string[];
  };

  rag?: {
    kbId: string;
    topK?: number;
    rerank?: boolean;
    filters?: Record<string, any>;
  };

  llm?: {
    provider?: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
  };

  security?: {
    piiRedaction?: boolean;
    promptInjectionDetection?: boolean;
    maxToolCalls?: number;
    auditLogging?: boolean;
  };

  eval?: {
    successCriteria?: string[];
    blockedPatterns?: string[];
  };
}
```

### 3.3 Compiler

```typescript
// packages/core/src/vibe-spec/compiler.ts

import { VibeSpec } from './types';
import { RetrievalConfig } from '@cofounder/rag';

export interface CompiledVibe {
  systemPrompt: string;
  retrievalConfig?: RetrievalConfig;
  llmConfig?: {
    provider?: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
  };
  securityConfig?: {
    piiRedaction: boolean;
    promptInjectionDetection: boolean;
    maxToolCalls: number;
  };
}

export function compileVibe(spec: VibeSpec): CompiledVibe {
  const constraints = spec.vibe?.constraints ?? [];
  const tone = spec.vibe?.tone ?? 'helpful, concise';

  // Build system prompt from vibe
  const systemPromptParts = [
    `You are ${spec.name}.`,
    spec.description,
    `Tone: ${tone}.`,
  ];

  if (constraints.length > 0) {
    systemPromptParts.push(
      `\nFollow these constraints strictly:\n- ${constraints.join('\n- ')}`
    );
  }

  if (spec.vibe?.allowedActions?.length) {
    systemPromptParts.push(
      `\nYou may use these actions: ${spec.vibe.allowedActions.join(', ')}`
    );
  }

  if (spec.vibe?.disallowedActions?.length) {
    systemPromptParts.push(
      `\nYou must NEVER use these actions: ${spec.vibe.disallowedActions.join(', ')}`
    );
  }

  return {
    systemPrompt: systemPromptParts.filter(Boolean).join('\n\n'),

    retrievalConfig: spec.rag
      ? {
          backend: 'supabase_pgvector',
          topK: spec.rag.topK ?? 8,
          filters: spec.rag.filters,
          rerank: spec.rag.rerank ?? true,
        }
      : undefined,

    llmConfig: spec.llm,

    securityConfig: spec.security
      ? {
          piiRedaction: spec.security.piiRedaction ?? false,
          promptInjectionDetection: spec.security.promptInjectionDetection ?? true,
          maxToolCalls: spec.security.maxToolCalls ?? 10,
        }
      : undefined,
  };
}

// Load from YAML file
export async function loadVibeSpec(path: string): Promise<VibeSpec> {
  const yaml = await import('js-yaml');
  const fs = await import('fs/promises');
  const content = await fs.readFile(path, 'utf-8');
  return yaml.load(content) as VibeSpec;
}
```

---

## 4. Adapters

### 4.1 @cofounder/crewai

```typescript
// packages/crewai/src/index.ts

import { RanaClient } from '@cofounder/core';

/**
 * Wraps CoFounder as a CrewAI-compatible model
 */
export class RanaCrewModel {
  private cofounder: RanaClient;
  private provider?: string;
  private model?: string;

  constructor(config: {
    cofounder: RanaClient;
    provider?: string;
    model?: string;
  }) {
    this.cofounder = config.cofounder;
    this.provider = config.provider;
    this.model = config.model;
  }

  async generate(prompt: string, options?: any): Promise<string> {
    const response = await this.cofounder.chat({
      messages: [{ role: 'user', content: prompt }],
      provider: this.provider,
      model: this.model,
      ...options,
    });
    return response.content;
  }

  async generateWithTools(
    prompt: string,
    tools: any[],
    options?: any
  ): Promise<{ content: string; toolCalls?: any[] }> {
    const response = await this.cofounder.chat({
      messages: [{ role: 'user', content: prompt }],
      tools,
      provider: this.provider,
      model: this.model,
      ...options,
    });
    return {
      content: response.content,
      toolCalls: response.toolCalls,
    };
  }
}

export function createCoFounderCrewModel(config: {
  cofounder: RanaClient;
  provider?: string;
  model?: string;
}): RanaCrewModel {
  return new RanaCrewModel(config);
}
```

### 4.2 @cofounder/langchain

```typescript
// packages/langchain/src/index.ts

import { RanaClient } from '@cofounder/core';
// Note: This would extend LangChain's BaseChatModel

export interface RanaChatModelConfig {
  cofounder: RanaClient;
  provider?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

/**
 * LangChain-compatible chat model that uses CoFounder under the hood
 *
 * @example
 * ```typescript
 * import { RanaChatModel } from '@cofounder/langchain';
 * import { createCoFounder } from '@cofounder/core';
 *
 * const cofounder = createCoFounder({ providers: { openai: '...' } });
 * const model = new RanaChatModel({ cofounder });
 *
 * // Use in LangChain chains
 * const chain = prompt.pipe(model).pipe(outputParser);
 * ```
 */
export class RanaChatModel {
  private cofounder: RanaClient;
  private config: RanaChatModelConfig;

  constructor(config: RanaChatModelConfig) {
    this.cofounder = config.cofounder;
    this.config = config;
  }

  async invoke(messages: any[], options?: any): Promise<any> {
    const response = await this.cofounder.chat({
      messages: messages.map(m => ({
        role: m.role || m._getType(),
        content: m.content,
      })),
      provider: this.config.provider,
      model: this.config.model,
      temperature: this.config.temperature,
      maxTokens: this.config.maxTokens,
      ...options,
    });

    return {
      content: response.content,
      additional_kwargs: {
        tool_calls: response.toolCalls,
        usage: response.usage,
      },
    };
  }

  async stream(messages: any[], options?: any): AsyncGenerator<any> {
    const stream = await this.cofounder.chat({
      messages: messages.map(m => ({
        role: m.role || m._getType(),
        content: m.content,
      })),
      stream: true,
      provider: this.config.provider,
      model: this.config.model,
      ...options,
    });

    for await (const chunk of stream) {
      yield {
        content: chunk.content,
        additional_kwargs: {},
      };
    }
  }
}

export function createCoFounderChatModel(config: RanaChatModelConfig): RanaChatModel {
  return new RanaChatModel(config);
}
```

### 4.3 @cofounder/mcp (MCP Integration)

```typescript
// packages/mcp/src/index.ts

import { RanaClient, MCPServer, MCPClient } from '@cofounder/core';
import { RAGClient } from '@cofounder/rag';
import { Tool } from '@cofounder/agents';

/**
 * Expose CoFounder tools and RAG as MCP resources
 */
export class RanaMCPServer {
  private server: MCPServer;
  private cofounder: RanaClient;
  private rag?: RAGClient;
  private tools: Tool[];

  constructor(config: {
    cofounder: RanaClient;
    rag?: RAGClient;
    tools?: Tool[];
    name?: string;
    version?: string;
  }) {
    this.cofounder = config.cofounder;
    this.rag = config.rag;
    this.tools = config.tools || [];

    this.server = new MCPServer({
      name: config.name || 'cofounder-mcp',
      version: config.version || '1.0.0',
    });

    this.registerTools();
    this.registerRAGResources();
  }

  private registerTools() {
    for (const tool of this.tools) {
      this.server.tool(
        tool.name,
        tool.description,
        tool.inputSchema || {},
        async (args, ctx) => {
          const result = await tool.run(args, {
            user: ctx.user,
            orgId: ctx.orgId,
          });
          return result.ok ? result.data : { error: result.error };
        }
      );
    }
  }

  private registerRAGResources() {
    if (!this.rag) return;

    // Register RAG query as a tool
    this.server.tool(
      'rag_query',
      'Search knowledge base and get AI-synthesized answer',
      {
        type: 'object',
        properties: {
          kbId: { type: 'string', description: 'Knowledge base ID' },
          query: { type: 'string', description: 'Search query' },
        },
        required: ['kbId', 'query'],
      },
      async (args, ctx) => {
        const result = await this.rag!.ask({
          kbId: args.kbId,
          orgId: ctx.orgId,
          query: args.query,
          userId: ctx.user?.id,
        });
        return {
          answer: result.answer,
          citations: result.citations,
        };
      }
    );
  }

  async start(transport: any) {
    await this.server.connect(transport);
  }
}

/**
 * Use external MCP tools inside CoFounder agents
 */
export class MCPToolAdapter {
  private client: MCPClient;

  constructor(config: { serverCommand: string; args?: string[] }) {
    this.client = new MCPClient({
      command: config.serverCommand,
      args: config.args,
    });
  }

  async connect(): Promise<void> {
    await this.client.connect();
  }

  async getTools(): Promise<Tool[]> {
    const mcpTools = await this.client.listTools();

    return mcpTools.map(t => ({
      name: t.name,
      description: t.description || '',
      inputSchema: t.inputSchema,
      run: async (input, ctx) => {
        try {
          const result = await this.client.callTool(t.name, input);
          return { ok: true, data: result };
        } catch (error) {
          return { ok: false, error: String(error) };
        }
      },
    }));
  }

  async disconnect(): Promise<void> {
    await this.client.disconnect();
  }
}

export function createCoFounderMCPServer(config: {
  cofounder: RanaClient;
  rag?: RAGClient;
  tools?: Tool[];
}): RanaMCPServer {
  return new RanaMCPServer(config);
}

export function createMCPToolAdapter(config: {
  serverCommand: string;
  args?: string[];
}): MCPToolAdapter {
  return new MCPToolAdapter(config);
}
```

---

## 5. Security Enhancements

### 5.1 PII Detection & Redaction Pipeline

```typescript
// Already exists in @cofounder/core as PIIDetector
// Enhanced usage for RAG/Agents:

import { PIIDetector, createPIIDetector } from '@cofounder/core';

export function createRAGSecurityPipeline(config: {
  piiRedaction: boolean;
  promptInjectionDetection: boolean;
}) {
  const piiDetector = createPIIDetector({
    mode: 'redact',
    types: ['email', 'phone', 'ssn', 'credit_card', 'name', 'address'],
  });

  return {
    async processInput(text: string): Promise<{ text: string; piiFound: boolean }> {
      if (!config.piiRedaction) {
        return { text, piiFound: false };
      }

      const result = piiDetector.detect(text);
      if (result.detections.length === 0) {
        return { text, piiFound: false };
      }

      return {
        text: piiDetector.redact(text),
        piiFound: true,
      };
    },

    async checkInjection(text: string): Promise<{ safe: boolean; risk: string }> {
      if (!config.promptInjectionDetection) {
        return { safe: true, risk: 'none' };
      }

      const { detectInjection } = await import('@cofounder/core');
      const result = detectInjection(text);

      return {
        safe: result.riskLevel === 'low',
        risk: result.riskLevel,
      };
    },
  };
}
```

### 5.2 Tool Safety Wrapper

```typescript
// packages/agents/src/security/tool-safety.ts

import { Tool, ToolContext, ToolResult } from '../types';

export interface ToolSafetyConfig {
  requireAuth: boolean;
  auditLog: boolean;
  rateLimit?: { requests: number; windowMs: number };
  allowedRoles?: string[];
}

export function wrapToolWithSafety(
  tool: Tool,
  config: ToolSafetyConfig
): Tool {
  const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

  return {
    ...tool,
    async run(input, ctx: ToolContext): Promise<ToolResult> {
      // Auth check
      if (config.requireAuth && !ctx.user?.id) {
        return { ok: false, error: 'Authentication required' };
      }

      // Role check
      if (config.allowedRoles?.length) {
        const hasRole = ctx.user?.roles?.some(r => config.allowedRoles!.includes(r));
        if (!hasRole) {
          return { ok: false, error: 'Insufficient permissions' };
        }
      }

      // Rate limit check
      if (config.rateLimit) {
        const key = `${ctx.user?.id || 'anon'}:${tool.name}`;
        const now = Date.now();
        const bucket = rateLimitStore.get(key);

        if (bucket && bucket.resetAt > now && bucket.count >= config.rateLimit.requests) {
          return { ok: false, error: 'Rate limit exceeded' };
        }

        if (!bucket || bucket.resetAt <= now) {
          rateLimitStore.set(key, { count: 1, resetAt: now + config.rateLimit.windowMs });
        } else {
          bucket.count++;
        }
      }

      // Execute tool
      const result = await tool.run(input, ctx);

      // Audit log
      if (config.auditLog) {
        console.log(JSON.stringify({
          event: 'tool_call',
          tool: tool.name,
          userId: ctx.user?.id,
          orgId: ctx.orgId,
          input: input,
          success: result.ok,
          timestamp: new Date().toISOString(),
        }));
      }

      return result;
    },
  };
}
```

---

## 6. CLI Commands

### New Commands to Add

```bash
# RAG Management
cofounder kb:create <name>              # Create knowledge base
cofounder kb:list                       # List knowledge bases
cofounder kb:ingest <kb-id> <source>    # Ingest documents
cofounder kb:query <kb-id> "question"   # Query knowledge base
cofounder kb:delete <kb-id>             # Delete knowledge base

# Agent Management
cofounder agent:new <name>              # Scaffold new agent
cofounder agent:test <agent-file>       # Run agent tests
cofounder agent:serve <agent-file>      # Start agent as API server
cofounder agent:chat <agent-file>       # Interactive chat with agent

# Vibe Management
cofounder vibe:new <name>               # Create new vibe config
cofounder vibe:validate <vibe-file>     # Validate vibe YAML
cofounder vibe:compile <vibe-file>      # Show compiled system prompt

# MCP
cofounder mcp:serve                     # Start CoFounder MCP server
cofounder mcp:connect <server>          # Connect to external MCP server
cofounder mcp:tools                     # List available MCP tools
```

---

## 7. Example Usage

### Complete Agent with RAG + Vibe

```typescript
import { createCoFounder } from '@cofounder/core';
import { RAGClient, createSupabaseRAGAdapter } from '@cofounder/rag';
import { createAgent, LLMAgent } from '@cofounder/agents';
import { loadVibeSpec, compileVibe } from '@cofounder/core/vibe-spec';

// Initialize CoFounder
const cofounder = createCoFounder({
  providers: {
    anthropic: process.env.ANTHROPIC_API_KEY!,
    openai: process.env.OPENAI_API_KEY!,
  },
});

// Initialize RAG
const rag = new RAGClient({
  cofounder,
  db: createSupabaseRAGAdapter({
    url: process.env.SUPABASE_URL!,
    anonKey: process.env.SUPABASE_ANON_KEY!,
  }),
});

// Load vibe
const vibe = await loadVibeSpec('./config/vibes/customer_support.yml');

// Create agent
const agent = createAgent(
  {
    cofounder,
    rag,
    vibe,
    tools: [
      {
        name: 'escalate_to_human',
        description: 'Escalate conversation to human support',
        run: async (input, ctx) => {
          // Create support ticket
          return { ok: true, data: { ticketId: 'TKT-123' } };
        },
      },
    ],
    user: { id: 'user_123', orgId: 'org_456', roles: ['customer'] },
  },
  {
    id: 'support_agent',
    name: 'Customer Support Agent',
    description: 'Helps customers with EU policy questions',
  }
);

// Handle user query
const result = await agent.handle({
  user: { id: 'user_123', orgId: 'org_456', roles: ['customer'] },
  message: 'What is your return policy for EU orders?',
  context: { kbId: 'policies_eu' },
});

console.log(result.messages[0].content);
console.log('Citations:', result.citations);
```

---

## Next Steps

1. **Implement** the RAG Client enhancements (knowledge base management, multi-tenant)
2. **Create** `@cofounder/agents` package with ADK
3. **Add** VibeSpec loader and compiler to core
4. **Build** adapter packages (@cofounder/crewai, @cofounder/langchain, @cofounder/mcp)
5. **Add** CLI commands for KB, agents, vibes
6. **Create** example apps demonstrating full stack

---

*Last updated: December 7, 2025*
*Version: 1.0.0*
