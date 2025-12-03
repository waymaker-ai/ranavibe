/**
 * Mem0 Integration for RANA
 *
 * Mem0 (formerly MemGPT) provides persistent memory for AI agents.
 * This integration enables long-term memory storage and retrieval.
 *
 * @see https://mem0.ai
 */

import { EventEmitter } from 'events';

// =============================================================================
// Types
// =============================================================================

export interface Mem0Config {
  /** Mem0 API key */
  apiKey: string;
  /** API base URL (defaults to Mem0 cloud) */
  baseUrl?: string;
  /** Organization ID (for team accounts) */
  organizationId?: string;
  /** Default user ID for memories */
  defaultUserId?: string;
  /** Default agent ID for agent memories */
  defaultAgentId?: string;
  /** Request timeout in ms */
  timeout?: number;
  /** Enable debug logging */
  debug?: boolean;
}

export interface Memory {
  /** Unique memory ID */
  id: string;
  /** Memory content/text */
  content: string;
  /** User ID associated with memory */
  userId?: string;
  /** Agent ID associated with memory */
  agentId?: string;
  /** Session/run ID */
  sessionId?: string;
  /** Memory type */
  type: 'fact' | 'preference' | 'interaction' | 'context' | 'custom';
  /** Relevance score (0-1) */
  score?: number;
  /** Memory metadata */
  metadata?: Record<string, any>;
  /** Creation timestamp */
  createdAt: Date;
  /** Last update timestamp */
  updatedAt: Date;
  /** Expiration timestamp (optional) */
  expiresAt?: Date;
}

export interface AddMemoryOptions {
  /** User ID */
  userId?: string;
  /** Agent ID */
  agentId?: string;
  /** Session ID */
  sessionId?: string;
  /** Memory type */
  type?: Memory['type'];
  /** Additional metadata */
  metadata?: Record<string, any>;
  /** TTL in seconds */
  ttl?: number;
  /** Embedding model to use */
  embeddingModel?: string;
}

export interface SearchMemoryOptions {
  /** User ID filter */
  userId?: string;
  /** Agent ID filter */
  agentId?: string;
  /** Session ID filter */
  sessionId?: string;
  /** Memory type filter */
  type?: Memory['type'];
  /** Maximum results */
  limit?: number;
  /** Minimum relevance score */
  minScore?: number;
  /** Metadata filters */
  filters?: Record<string, any>;
  /** Include expired memories */
  includeExpired?: boolean;
}

export interface MemoryUpdate {
  /** New content */
  content?: string;
  /** Updated metadata */
  metadata?: Record<string, any>;
  /** Updated TTL */
  ttl?: number;
}

export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
}

export interface MemoryStats {
  totalMemories: number;
  byType: Record<Memory['type'], number>;
  byUser: Record<string, number>;
  storageUsedBytes: number;
  lastUpdated: Date;
}

// =============================================================================
// Error Classes
// =============================================================================

export class Mem0Error extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message);
    this.name = 'Mem0Error';
  }
}

// =============================================================================
// Mem0 Integration
// =============================================================================

export class Mem0Integration extends EventEmitter {
  private config: Required<Omit<Mem0Config, 'organizationId' | 'defaultUserId' | 'defaultAgentId'>> &
    Pick<Mem0Config, 'organizationId' | 'defaultUserId' | 'defaultAgentId'>;
  private memoryCache: Map<string, { memory: Memory; cachedAt: Date }> = new Map();
  private cacheTTL = 60000; // 1 minute cache

  constructor(config: Mem0Config) {
    super();
    this.config = {
      baseUrl: 'https://api.mem0.ai/v1',
      timeout: 30000,
      debug: false,
      ...config,
    };
  }

  // ===========================================================================
  // Memory CRUD Operations
  // ===========================================================================

  /**
   * Add a new memory
   */
  async add(content: string, options: AddMemoryOptions = {}): Promise<Memory> {
    const userId = options.userId || this.config.defaultUserId;
    const agentId = options.agentId || this.config.defaultAgentId;

    const response = await this.request('POST', '/memories', {
      content,
      user_id: userId,
      agent_id: agentId,
      session_id: options.sessionId,
      type: options.type || 'fact',
      metadata: options.metadata,
      ttl: options.ttl,
      embedding_model: options.embeddingModel,
    });

    const memory = this.transformMemory(response.memory);
    this.emit('memory:added', memory);

    if (this.config.debug) {
      console.log(`[Mem0] Added memory: ${memory.id}`);
    }

    return memory;
  }

  /**
   * Add memories from a conversation
   */
  async addFromConversation(
    messages: ConversationMessage[],
    options: AddMemoryOptions = {}
  ): Promise<Memory[]> {
    const userId = options.userId || this.config.defaultUserId;
    const agentId = options.agentId || this.config.defaultAgentId;

    const response = await this.request('POST', '/memories/conversation', {
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
        timestamp: m.timestamp?.toISOString(),
      })),
      user_id: userId,
      agent_id: agentId,
      session_id: options.sessionId,
      metadata: options.metadata,
    });

    const memories = response.memories.map((m: any) => this.transformMemory(m));
    this.emit('memories:extracted', memories);

    if (this.config.debug) {
      console.log(`[Mem0] Extracted ${memories.length} memories from conversation`);
    }

    return memories;
  }

  /**
   * Get a memory by ID
   */
  async get(memoryId: string): Promise<Memory | null> {
    // Check cache first
    const cached = this.memoryCache.get(memoryId);
    if (cached && Date.now() - cached.cachedAt.getTime() < this.cacheTTL) {
      return cached.memory;
    }

    try {
      const response = await this.request('GET', `/memories/${memoryId}`);
      const memory = this.transformMemory(response.memory);

      // Update cache
      this.memoryCache.set(memoryId, { memory, cachedAt: new Date() });

      return memory;
    } catch (error) {
      if (error instanceof Mem0Error && error.statusCode === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Search memories by semantic similarity
   */
  async search(query: string, options: SearchMemoryOptions = {}): Promise<Memory[]> {
    const userId = options.userId || this.config.defaultUserId;
    const agentId = options.agentId || this.config.defaultAgentId;

    const response = await this.request('POST', '/memories/search', {
      query,
      user_id: userId,
      agent_id: agentId,
      session_id: options.sessionId,
      type: options.type,
      limit: options.limit || 10,
      min_score: options.minScore,
      filters: options.filters,
      include_expired: options.includeExpired,
    });

    const memories = response.memories.map((m: any) => this.transformMemory(m));
    this.emit('memory:searched', { query, results: memories.length });

    return memories;
  }

  /**
   * Get all memories for a user/agent
   */
  async getAll(options: SearchMemoryOptions = {}): Promise<Memory[]> {
    const userId = options.userId || this.config.defaultUserId;
    const agentId = options.agentId || this.config.defaultAgentId;

    const response = await this.request('GET', '/memories', {
      user_id: userId,
      agent_id: agentId,
      session_id: options.sessionId,
      type: options.type,
      limit: options.limit || 100,
    });

    return response.memories.map((m: any) => this.transformMemory(m));
  }

  /**
   * Update a memory
   */
  async update(memoryId: string, update: MemoryUpdate): Promise<Memory> {
    const response = await this.request('PATCH', `/memories/${memoryId}`, {
      content: update.content,
      metadata: update.metadata,
      ttl: update.ttl,
    });

    const memory = this.transformMemory(response.memory);

    // Update cache
    this.memoryCache.set(memoryId, { memory, cachedAt: new Date() });
    this.emit('memory:updated', memory);

    return memory;
  }

  /**
   * Delete a memory
   */
  async delete(memoryId: string): Promise<void> {
    await this.request('DELETE', `/memories/${memoryId}`);
    this.memoryCache.delete(memoryId);
    this.emit('memory:deleted', memoryId);
  }

  /**
   * Delete all memories for a user/agent
   */
  async deleteAll(options: { userId?: string; agentId?: string; sessionId?: string } = {}): Promise<number> {
    const userId = options.userId || this.config.defaultUserId;
    const agentId = options.agentId || this.config.defaultAgentId;

    const response = await this.request('DELETE', '/memories', {
      user_id: userId,
      agent_id: agentId,
      session_id: options.sessionId,
    });

    // Clear cache for affected memories
    this.memoryCache.clear();
    this.emit('memories:deleted', { count: response.deleted_count });

    return response.deleted_count;
  }

  // ===========================================================================
  // Memory History
  // ===========================================================================

  /**
   * Get memory history (changes over time)
   */
  async getHistory(memoryId: string): Promise<Array<{
    version: number;
    content: string;
    changedAt: Date;
    changeType: 'created' | 'updated' | 'merged';
  }>> {
    const response = await this.request('GET', `/memories/${memoryId}/history`);

    return response.history.map((h: any) => ({
      version: h.version,
      content: h.content,
      changedAt: new Date(h.changed_at),
      changeType: h.change_type,
    }));
  }

  // ===========================================================================
  // Agent Context
  // ===========================================================================

  /**
   * Get relevant context for an agent based on current conversation
   */
  async getContext(
    messages: ConversationMessage[],
    options: {
      userId?: string;
      agentId?: string;
      maxMemories?: number;
      includeTypes?: Memory['type'][];
    } = {}
  ): Promise<{
    memories: Memory[];
    context: string;
    suggestions: string[];
  }> {
    const userId = options.userId || this.config.defaultUserId;
    const agentId = options.agentId || this.config.defaultAgentId;

    const response = await this.request('POST', '/context', {
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
      user_id: userId,
      agent_id: agentId,
      max_memories: options.maxMemories || 5,
      include_types: options.includeTypes,
    });

    return {
      memories: response.memories.map((m: any) => this.transformMemory(m)),
      context: response.context,
      suggestions: response.suggestions || [],
    };
  }

  /**
   * Format memories as context for LLM prompts
   */
  formatAsContext(memories: Memory[]): string {
    if (memories.length === 0) {
      return '';
    }

    const sections: string[] = ['## Relevant Context from Memory\n'];

    // Group by type
    const byType = new Map<Memory['type'], Memory[]>();
    for (const memory of memories) {
      const existing = byType.get(memory.type) || [];
      existing.push(memory);
      byType.set(memory.type, existing);
    }

    // Format each type
    const typeLabels: Record<Memory['type'], string> = {
      fact: 'Facts',
      preference: 'User Preferences',
      interaction: 'Past Interactions',
      context: 'Context',
      custom: 'Other',
    };

    for (const [type, typeMemories] of byType) {
      sections.push(`### ${typeLabels[type]}`);
      for (const memory of typeMemories) {
        sections.push(`- ${memory.content}`);
      }
      sections.push('');
    }

    return sections.join('\n');
  }

  // ===========================================================================
  // Statistics
  // ===========================================================================

  /**
   * Get memory statistics
   */
  async getStats(options: { userId?: string; agentId?: string } = {}): Promise<MemoryStats> {
    const userId = options.userId || this.config.defaultUserId;
    const agentId = options.agentId || this.config.defaultAgentId;

    const response = await this.request('GET', '/stats', {
      user_id: userId,
      agent_id: agentId,
    });

    return {
      totalMemories: response.total_memories,
      byType: response.by_type,
      byUser: response.by_user || {},
      storageUsedBytes: response.storage_used_bytes,
      lastUpdated: new Date(response.last_updated),
    };
  }

  // ===========================================================================
  // RANA Integration Helpers
  // ===========================================================================

  /**
   * Create a RANA middleware for automatic memory management
   */
  createMiddleware(options: {
    extractMemories?: boolean;
    injectContext?: boolean;
    userId?: string | ((ctx: any) => string);
    agentId?: string | ((ctx: any) => string);
  } = {}): (ctx: any, next: () => Promise<any>) => Promise<any> {
    return async (ctx: any, next: () => Promise<any>) => {
      const userId = typeof options.userId === 'function'
        ? options.userId(ctx)
        : options.userId || this.config.defaultUserId;
      const agentId = typeof options.agentId === 'function'
        ? options.agentId(ctx)
        : options.agentId || this.config.defaultAgentId;

      // Inject context before LLM call
      if (options.injectContext && ctx.messages) {
        const { context } = await this.getContext(ctx.messages, { userId, agentId });
        if (context) {
          ctx.systemMessage = (ctx.systemMessage || '') + '\n\n' + context;
        }
      }

      await next();

      // Extract memories after response
      if (options.extractMemories && ctx.messages && ctx.response) {
        const allMessages = [
          ...ctx.messages,
          { role: 'assistant' as const, content: ctx.response },
        ];
        await this.addFromConversation(allMessages, { userId, agentId });
      }
    };
  }

  /**
   * Create a memory-aware system prompt
   */
  async createSystemPrompt(
    basePrompt: string,
    options: {
      userId?: string;
      agentId?: string;
      query?: string;
      maxMemories?: number;
    } = {}
  ): Promise<string> {
    let memories: Memory[] = [];

    if (options.query) {
      memories = await this.search(options.query, {
        userId: options.userId,
        agentId: options.agentId,
        limit: options.maxMemories || 5,
      });
    } else {
      memories = await this.getAll({
        userId: options.userId,
        agentId: options.agentId,
        limit: options.maxMemories || 5,
      });
    }

    const context = this.formatAsContext(memories);

    return context ? `${basePrompt}\n\n${context}` : basePrompt;
  }

  // ===========================================================================
  // HTTP Client
  // ===========================================================================

  private async request(
    method: string,
    path: string,
    data?: Record<string, any>
  ): Promise<any> {
    const url = `${this.config.baseUrl}${path}`;
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.config.apiKey}`,
      'Content-Type': 'application/json',
    };

    if (this.config.organizationId) {
      headers['X-Organization-Id'] = this.config.organizationId;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: data ? JSON.stringify(data) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Mem0Error(
          errorBody.message || `Request failed: ${response.statusText}`,
          errorBody.code || 'REQUEST_FAILED',
          response.status,
          errorBody
        );
      }

      return response.json();
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Mem0Error) {
        throw error;
      }

      if (error instanceof Error && error.name === 'AbortError') {
        throw new Mem0Error('Request timeout', 'TIMEOUT', 408);
      }

      throw new Mem0Error(
        error instanceof Error ? error.message : 'Unknown error',
        'NETWORK_ERROR'
      );
    }
  }

  private transformMemory(data: any): Memory {
    return {
      id: data.id,
      content: data.content,
      userId: data.user_id,
      agentId: data.agent_id,
      sessionId: data.session_id,
      type: data.type || 'fact',
      score: data.score,
      metadata: data.metadata || {},
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      expiresAt: data.expires_at ? new Date(data.expires_at) : undefined,
    };
  }
}

// =============================================================================
// Factory Functions
// =============================================================================

/**
 * Create a Mem0 integration instance
 */
export function createMem0Integration(config: Mem0Config): Mem0Integration {
  return new Mem0Integration(config);
}

/**
 * Create a memory-aware agent wrapper
 */
export function withMemory(
  agent: any,
  mem0: Mem0Integration,
  options: {
    userId?: string;
    agentId?: string;
    extractMemories?: boolean;
    injectContext?: boolean;
  } = {}
): any {
  const originalRun = agent.run?.bind(agent) || agent.invoke?.bind(agent);

  if (!originalRun) {
    throw new Error('Agent must have a run() or invoke() method');
  }

  return {
    ...agent,
    async run(input: any, context?: any) {
      const userId = options.userId || context?.userId;
      const agentId = options.agentId || context?.agentId;

      // Get relevant memories
      let systemContext = '';
      if (options.injectContext) {
        const query = typeof input === 'string' ? input : input.message || input.query;
        const memories = await mem0.search(query, { userId, agentId, limit: 5 });
        systemContext = mem0.formatAsContext(memories);
      }

      // Run the agent
      const result = await originalRun(input, {
        ...context,
        systemContext,
      });

      // Extract and store memories
      if (options.extractMemories) {
        const messages: ConversationMessage[] = [
          { role: 'user', content: typeof input === 'string' ? input : input.message },
          { role: 'assistant', content: typeof result === 'string' ? result : result.response },
        ];
        await mem0.addFromConversation(messages, { userId, agentId });
      }

      return result;
    },
  };
}
