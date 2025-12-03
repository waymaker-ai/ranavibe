/**
 * Zep Integration for RANA
 *
 * Zep is a long-term memory store for LLM applications.
 * It provides automatic memory extraction, summarization, and retrieval.
 *
 * @see https://www.getzep.com
 */

import { EventEmitter } from 'events';

// =============================================================================
// Types
// =============================================================================

export interface ZepConfig {
  /** Zep API key */
  apiKey: string;
  /** Zep server URL (for self-hosted) or cloud URL */
  baseUrl?: string;
  /** Project name */
  projectName?: string;
  /** Request timeout in ms */
  timeout?: number;
  /** Enable debug logging */
  debug?: boolean;
}

export interface ZepUser {
  /** Unique user ID */
  userId: string;
  /** User email */
  email?: string;
  /** User first name */
  firstName?: string;
  /** User last name */
  lastName?: string;
  /** Custom metadata */
  metadata?: Record<string, any>;
  /** Creation timestamp */
  createdAt?: Date;
  /** Update timestamp */
  updatedAt?: Date;
}

export interface ZepSession {
  /** Unique session ID */
  sessionId: string;
  /** User ID */
  userId?: string;
  /** Session metadata */
  metadata?: Record<string, any>;
  /** Session classification */
  classification?: string;
  /** Creation timestamp */
  createdAt?: Date;
  /** Update timestamp */
  updatedAt?: Date;
}

export interface ZepMessage {
  /** Unique message UUID */
  uuid?: string;
  /** Message role */
  role: 'user' | 'assistant' | 'system' | 'function' | 'tool';
  /** Message content */
  content: string;
  /** Role type for display */
  roleType?: 'user' | 'assistant' | 'system' | 'function' | 'tool';
  /** Token count */
  tokenCount?: number;
  /** Message metadata */
  metadata?: Record<string, any>;
  /** Creation timestamp */
  createdAt?: Date;
}

export interface ZepMemory {
  /** Session messages */
  messages: ZepMessage[];
  /** Session summary */
  summary?: ZepSummary;
  /** Relevant facts */
  facts?: string[];
  /** Memory context for prompts */
  context?: string;
}

export interface ZepSummary {
  /** Summary UUID */
  uuid: string;
  /** Summary content */
  content: string;
  /** Token count */
  tokenCount: number;
  /** Summary metadata */
  metadata?: Record<string, any>;
  /** Creation timestamp */
  createdAt: Date;
}

export interface ZepSearchResult {
  /** Message that matched */
  message: ZepMessage;
  /** Relevance score */
  score: number;
  /** Summary context if available */
  summary?: string;
  /** Matched session ID */
  sessionId: string;
}

export interface ZepFact {
  /** Fact UUID */
  uuid: string;
  /** Fact content */
  fact: string;
  /** Validity (true/false/unknown) */
  validity?: boolean;
  /** Confidence score */
  confidence?: number;
  /** Source message UUID */
  sourceMessageUuid?: string;
  /** Creation timestamp */
  createdAt: Date;
}

export interface AddMessagesOptions {
  /** Return summary with response */
  returnSummary?: boolean;
  /** Summarize immediately */
  summarize?: boolean;
}

export interface SearchOptions {
  /** Number of results */
  limit?: number;
  /** Minimum score threshold */
  minScore?: number;
  /** Search type */
  searchType?: 'similarity' | 'mmr';
  /** MMR lambda (0-1, relevance vs diversity) */
  mmrLambda?: number;
  /** Filter by metadata */
  metadata?: Record<string, any>;
}

export interface GetMemoryOptions {
  /** Number of recent messages to retrieve */
  lastN?: number;
  /** Minimum score for memory relevance */
  minScore?: number;
}

// =============================================================================
// Error Classes
// =============================================================================

export class ZepError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message);
    this.name = 'ZepError';
  }
}

// =============================================================================
// Zep Integration
// =============================================================================

export class ZepIntegration extends EventEmitter {
  private config: Required<Omit<ZepConfig, 'projectName'>> & Pick<ZepConfig, 'projectName'>;

  constructor(config: ZepConfig) {
    super();
    this.config = {
      baseUrl: 'https://api.getzep.com/api/v2',
      timeout: 30000,
      debug: false,
      ...config,
    };
  }

  // ===========================================================================
  // User Management
  // ===========================================================================

  /**
   * Create or update a user
   */
  async addUser(user: ZepUser): Promise<ZepUser> {
    const response = await this.request('POST', '/users', {
      user_id: user.userId,
      email: user.email,
      first_name: user.firstName,
      last_name: user.lastName,
      metadata: user.metadata,
    });

    const result = this.transformUser(response);
    this.emit('user:created', result);
    return result;
  }

  /**
   * Get a user by ID
   */
  async getUser(userId: string): Promise<ZepUser | null> {
    try {
      const response = await this.request('GET', `/users/${userId}`);
      return this.transformUser(response);
    } catch (error) {
      if (error instanceof ZepError && error.statusCode === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Update user metadata
   */
  async updateUser(userId: string, updates: Partial<ZepUser>): Promise<ZepUser> {
    const response = await this.request('PATCH', `/users/${userId}`, {
      email: updates.email,
      first_name: updates.firstName,
      last_name: updates.lastName,
      metadata: updates.metadata,
    });

    const result = this.transformUser(response);
    this.emit('user:updated', result);
    return result;
  }

  /**
   * Delete a user and all associated data
   */
  async deleteUser(userId: string): Promise<void> {
    await this.request('DELETE', `/users/${userId}`);
    this.emit('user:deleted', userId);
  }

  /**
   * List all users
   */
  async listUsers(options: { limit?: number; cursor?: string } = {}): Promise<{
    users: ZepUser[];
    cursor?: string;
  }> {
    const params = new URLSearchParams();
    if (options.limit) params.set('limit', options.limit.toString());
    if (options.cursor) params.set('cursor', options.cursor);

    const response = await this.request('GET', `/users?${params.toString()}`);
    return {
      users: response.users.map((u: any) => this.transformUser(u)),
      cursor: response.cursor,
    };
  }

  // ===========================================================================
  // Session Management
  // ===========================================================================

  /**
   * Create a new session
   */
  async createSession(session: {
    sessionId: string;
    userId?: string;
    metadata?: Record<string, any>;
  }): Promise<ZepSession> {
    const response = await this.request('POST', '/sessions', {
      session_id: session.sessionId,
      user_id: session.userId,
      metadata: session.metadata,
    });

    const result = this.transformSession(response);
    this.emit('session:created', result);
    return result;
  }

  /**
   * Get a session by ID
   */
  async getSession(sessionId: string): Promise<ZepSession | null> {
    try {
      const response = await this.request('GET', `/sessions/${sessionId}`);
      return this.transformSession(response);
    } catch (error) {
      if (error instanceof ZepError && error.statusCode === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Update session metadata
   */
  async updateSession(sessionId: string, metadata: Record<string, any>): Promise<ZepSession> {
    const response = await this.request('PATCH', `/sessions/${sessionId}`, {
      metadata,
    });

    const result = this.transformSession(response);
    this.emit('session:updated', result);
    return result;
  }

  /**
   * Delete a session
   */
  async deleteSession(sessionId: string): Promise<void> {
    await this.request('DELETE', `/sessions/${sessionId}`);
    this.emit('session:deleted', sessionId);
  }

  /**
   * List sessions for a user
   */
  async listSessions(options: {
    userId?: string;
    limit?: number;
    cursor?: string;
  } = {}): Promise<{
    sessions: ZepSession[];
    cursor?: string;
  }> {
    const params = new URLSearchParams();
    if (options.userId) params.set('user_id', options.userId);
    if (options.limit) params.set('limit', options.limit.toString());
    if (options.cursor) params.set('cursor', options.cursor);

    const response = await this.request('GET', `/sessions?${params.toString()}`);
    return {
      sessions: response.sessions.map((s: any) => this.transformSession(s)),
      cursor: response.cursor,
    };
  }

  // ===========================================================================
  // Memory Operations
  // ===========================================================================

  /**
   * Add messages to a session's memory
   */
  async addMemory(
    sessionId: string,
    messages: ZepMessage[],
    options: AddMessagesOptions = {}
  ): Promise<void> {
    await this.request('POST', `/sessions/${sessionId}/memory`, {
      messages: messages.map(m => ({
        role: m.role,
        role_type: m.roleType || m.role,
        content: m.content,
        metadata: m.metadata,
      })),
      return_context: options.returnSummary,
      summarize_instruction: options.summarize ? 'immediate' : undefined,
    });

    this.emit('memory:added', { sessionId, messageCount: messages.length });

    if (this.config.debug) {
      console.log(`[Zep] Added ${messages.length} messages to session ${sessionId}`);
    }
  }

  /**
   * Get memory for a session
   */
  async getMemory(sessionId: string, options: GetMemoryOptions = {}): Promise<ZepMemory> {
    const params = new URLSearchParams();
    if (options.lastN) params.set('lastn', options.lastN.toString());
    if (options.minScore) params.set('min_score', options.minScore.toString());

    const response = await this.request('GET', `/sessions/${sessionId}/memory?${params.toString()}`);

    return {
      messages: response.messages?.map((m: any) => this.transformMessage(m)) || [],
      summary: response.summary ? {
        uuid: response.summary.uuid,
        content: response.summary.content,
        tokenCount: response.summary.token_count,
        metadata: response.summary.metadata,
        createdAt: new Date(response.summary.created_at),
      } : undefined,
      facts: response.facts,
      context: response.context,
    };
  }

  /**
   * Delete memory for a session
   */
  async deleteMemory(sessionId: string): Promise<void> {
    await this.request('DELETE', `/sessions/${sessionId}/memory`);
    this.emit('memory:deleted', sessionId);
  }

  /**
   * Search across session memories
   */
  async searchMemory(
    sessionId: string,
    query: string,
    options: SearchOptions = {}
  ): Promise<ZepSearchResult[]> {
    const response = await this.request('POST', `/sessions/${sessionId}/search`, {
      text: query,
      limit: options.limit || 10,
      min_score: options.minScore,
      search_type: options.searchType || 'similarity',
      mmr_lambda: options.mmrLambda,
      metadata: options.metadata,
    });

    const results: ZepSearchResult[] = response.results.map((r: any) => ({
      message: this.transformMessage(r.message),
      score: r.score,
      summary: r.summary,
      sessionId,
    }));

    this.emit('memory:searched', { sessionId, query, resultCount: results.length });
    return results;
  }

  /**
   * Search across all sessions (global search)
   */
  async searchAll(
    query: string,
    options: SearchOptions & { userId?: string } = {}
  ): Promise<ZepSearchResult[]> {
    const response = await this.request('POST', '/memory/search', {
      text: query,
      user_id: options.userId,
      limit: options.limit || 10,
      min_score: options.minScore,
      search_type: options.searchType || 'similarity',
      mmr_lambda: options.mmrLambda,
    });

    return response.results.map((r: any) => ({
      message: this.transformMessage(r.message),
      score: r.score,
      summary: r.summary,
      sessionId: r.session_id,
    }));
  }

  // ===========================================================================
  // Facts Management
  // ===========================================================================

  /**
   * Get extracted facts for a user
   */
  async getFacts(userId: string): Promise<ZepFact[]> {
    const response = await this.request('GET', `/users/${userId}/facts`);
    return response.facts.map((f: any) => this.transformFact(f));
  }

  /**
   * Add a fact manually
   */
  async addFact(userId: string, fact: string, metadata?: Record<string, any>): Promise<ZepFact> {
    const response = await this.request('POST', `/users/${userId}/facts`, {
      fact,
      metadata,
    });

    const result = this.transformFact(response);
    this.emit('fact:added', result);
    return result;
  }

  /**
   * Delete a fact
   */
  async deleteFact(userId: string, factUuid: string): Promise<void> {
    await this.request('DELETE', `/users/${userId}/facts/${factUuid}`);
    this.emit('fact:deleted', factUuid);
  }

  // ===========================================================================
  // Summary Operations
  // ===========================================================================

  /**
   * Get session summary
   */
  async getSummary(sessionId: string): Promise<ZepSummary | null> {
    try {
      const response = await this.request('GET', `/sessions/${sessionId}/summary`);
      if (!response) return null;

      return {
        uuid: response.uuid,
        content: response.content,
        tokenCount: response.token_count,
        metadata: response.metadata,
        createdAt: new Date(response.created_at),
      };
    } catch (error) {
      if (error instanceof ZepError && error.statusCode === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Trigger immediate summarization
   */
  async summarize(sessionId: string): Promise<ZepSummary> {
    const response = await this.request('POST', `/sessions/${sessionId}/summarize`);

    const summary: ZepSummary = {
      uuid: response.uuid,
      content: response.content,
      tokenCount: response.token_count,
      metadata: response.metadata,
      createdAt: new Date(response.created_at),
    };

    this.emit('summary:created', { sessionId, summary });
    return summary;
  }

  // ===========================================================================
  // Classification
  // ===========================================================================

  /**
   * Classify a session (intent/topic)
   */
  async classifySession(sessionId: string, classes: string[]): Promise<{
    class: string;
    confidence: number;
  }> {
    const response = await this.request('POST', `/sessions/${sessionId}/classify`, {
      classes,
    });

    return {
      class: response.class,
      confidence: response.confidence,
    };
  }

  // ===========================================================================
  // RANA Integration Helpers
  // ===========================================================================

  /**
   * Create RANA middleware for automatic memory management
   */
  createMiddleware(options: {
    sessionIdGetter: (ctx: any) => string;
    userIdGetter?: (ctx: any) => string | undefined;
    autoCreateSession?: boolean;
    injectSummary?: boolean;
  }): (ctx: any, next: () => Promise<any>) => Promise<any> {
    return async (ctx: any, next: () => Promise<any>) => {
      const sessionId = options.sessionIdGetter(ctx);
      const userId = options.userIdGetter?.(ctx);

      // Auto-create session if needed
      if (options.autoCreateSession) {
        const existing = await this.getSession(sessionId);
        if (!existing) {
          await this.createSession({ sessionId, userId });
        }
      }

      // Inject memory context
      if (options.injectSummary) {
        const memory = await this.getMemory(sessionId, { lastN: 10 });
        if (memory.context) {
          ctx.memoryContext = memory.context;
        }
        if (memory.summary) {
          ctx.memorySummary = memory.summary.content;
        }
      }

      // Store user message
      if (ctx.message || ctx.input) {
        await this.addMemory(sessionId, [{
          role: 'user',
          content: ctx.message || ctx.input,
        }]);
      }

      await next();

      // Store assistant response
      if (ctx.response || ctx.output) {
        await this.addMemory(sessionId, [{
          role: 'assistant',
          content: ctx.response || ctx.output,
        }]);
      }
    };
  }

  /**
   * Format memory as LLM context
   */
  formatAsContext(memory: ZepMemory): string {
    const sections: string[] = [];

    // Add summary
    if (memory.summary) {
      sections.push('## Conversation Summary');
      sections.push(memory.summary.content);
      sections.push('');
    }

    // Add facts
    if (memory.facts && memory.facts.length > 0) {
      sections.push('## Known Facts');
      for (const fact of memory.facts) {
        sections.push(`- ${fact}`);
      }
      sections.push('');
    }

    // Add recent messages
    if (memory.messages.length > 0) {
      sections.push('## Recent Messages');
      for (const msg of memory.messages.slice(-5)) {
        sections.push(`**${msg.role}**: ${msg.content}`);
      }
    }

    return sections.join('\n');
  }

  /**
   * Create a memory-aware system prompt
   */
  async createSystemPrompt(
    basePrompt: string,
    sessionId: string,
    options: {
      includeSummary?: boolean;
      includeFacts?: boolean;
      includeRecentMessages?: number;
    } = {}
  ): Promise<string> {
    const memory = await this.getMemory(sessionId, {
      lastN: options.includeRecentMessages || 5,
    });

    const parts = [basePrompt];

    if (options.includeSummary && memory.summary) {
      parts.push(`\n\n## Conversation Context\n${memory.summary.content}`);
    }

    if (options.includeFacts && memory.facts && memory.facts.length > 0) {
      parts.push(`\n\n## Known Information\n${memory.facts.map(f => `- ${f}`).join('\n')}`);
    }

    return parts.join('');
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
      'Authorization': `Api-Key ${this.config.apiKey}`,
      'Content-Type': 'application/json',
    };

    if (this.config.projectName) {
      headers['X-Project-Name'] = this.config.projectName;
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
        throw new ZepError(
          errorBody.message || `Request failed: ${response.statusText}`,
          errorBody.code || 'REQUEST_FAILED',
          response.status,
          errorBody
        );
      }

      const text = await response.text();
      return text ? JSON.parse(text) : null;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof ZepError) {
        throw error;
      }

      if (error instanceof Error && error.name === 'AbortError') {
        throw new ZepError('Request timeout', 'TIMEOUT', 408);
      }

      throw new ZepError(
        error instanceof Error ? error.message : 'Unknown error',
        'NETWORK_ERROR'
      );
    }
  }

  private transformUser(data: any): ZepUser {
    return {
      userId: data.user_id,
      email: data.email,
      firstName: data.first_name,
      lastName: data.last_name,
      metadata: data.metadata,
      createdAt: data.created_at ? new Date(data.created_at) : undefined,
      updatedAt: data.updated_at ? new Date(data.updated_at) : undefined,
    };
  }

  private transformSession(data: any): ZepSession {
    return {
      sessionId: data.session_id,
      userId: data.user_id,
      metadata: data.metadata,
      classification: data.classification,
      createdAt: data.created_at ? new Date(data.created_at) : undefined,
      updatedAt: data.updated_at ? new Date(data.updated_at) : undefined,
    };
  }

  private transformMessage(data: any): ZepMessage {
    return {
      uuid: data.uuid,
      role: data.role,
      roleType: data.role_type,
      content: data.content,
      tokenCount: data.token_count,
      metadata: data.metadata,
      createdAt: data.created_at ? new Date(data.created_at) : undefined,
    };
  }

  private transformFact(data: any): ZepFact {
    return {
      uuid: data.uuid,
      fact: data.fact,
      validity: data.validity,
      confidence: data.confidence,
      sourceMessageUuid: data.source_message_uuid,
      createdAt: new Date(data.created_at),
    };
  }
}

// =============================================================================
// Factory Functions
// =============================================================================

/**
 * Create a Zep integration instance
 */
export function createZepIntegration(config: ZepConfig): ZepIntegration {
  return new ZepIntegration(config);
}

/**
 * Create a Zep-powered conversation manager
 */
export function createZepConversation(
  zep: ZepIntegration,
  options: {
    sessionId: string;
    userId?: string;
    systemPrompt?: string;
  }
): {
  addMessage: (role: 'user' | 'assistant', content: string) => Promise<void>;
  getContext: () => Promise<string>;
  search: (query: string) => Promise<ZepSearchResult[]>;
  summarize: () => Promise<ZepSummary>;
  clear: () => Promise<void>;
} {
  return {
    async addMessage(role, content) {
      await zep.addMemory(options.sessionId, [{ role, content }]);
    },

    async getContext() {
      const memory = await zep.getMemory(options.sessionId, { lastN: 10 });
      let context = options.systemPrompt || '';

      if (memory.summary) {
        context += `\n\n## Context\n${memory.summary.content}`;
      }

      if (memory.facts && memory.facts.length > 0) {
        context += `\n\n## Known Facts\n${memory.facts.join('\n')}`;
      }

      return context;
    },

    async search(query) {
      return zep.searchMemory(options.sessionId, query);
    },

    async summarize() {
      return zep.summarize(options.sessionId);
    },

    async clear() {
      await zep.deleteMemory(options.sessionId);
    },
  };
}
