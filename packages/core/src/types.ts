/**
 * RANA Core Types
 * TypeScript definitions for the RANA SDK
 */

// ============================================================================
// Provider Types
// ============================================================================

export type LLMProvider =
  | 'anthropic'
  | 'openai'
  | 'google'
  | 'xai'
  | 'mistral'
  | 'cohere'
  | 'together'
  | 'groq'
  | 'ollama';

// Provider-specific model types
export type AnthropicModel =
  | 'claude-3-5-sonnet-20241022'
  | 'claude-3-5-haiku-20241022'
  | 'claude-3-opus-20240229'
  | 'claude-3-sonnet-20240229'
  | 'claude-3-haiku-20240307';

export type OpenAIModel =
  | 'gpt-4o'
  | 'gpt-4o-mini'
  | 'gpt-4-turbo'
  | 'gpt-4'
  | 'gpt-3.5-turbo';

export type GoogleModel =
  | 'gemini-2.0-flash-exp'
  | 'gemini-1.5-pro'
  | 'gemini-1.5-flash';

export type LLMModel = AnthropicModel | OpenAIModel | GoogleModel | string;

// ============================================================================
// Message Types
// ============================================================================

export type MessageRole = 'system' | 'user' | 'assistant' | 'tool';

export interface Message {
  role: MessageRole;
  content: string | ContentPart[];
  name?: string;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
}

export interface ContentPart {
  type: 'text' | 'image_url' | 'image' | 'audio' | 'video';
  text?: string;
  image_url?: {
    url: string;
    detail?: 'low' | 'high' | 'auto';
  };
  source?: {
    type: 'base64' | 'url';
    media_type: string;
    data: string;
  };
}

// ============================================================================
// Tool Calling Types
// ============================================================================

export interface ToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, any>;
      required?: string[];
    };
  };
}

export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

// ============================================================================
// Request/Response Types
// ============================================================================

export interface RanaChatRequest {
  // Provider selection
  provider?: LLMProvider;
  model?: LLMModel;

  // Messages
  messages: Message[];

  // Generation parameters
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  stop?: string | string[];

  // Tools (function calling)
  tools?: ToolDefinition[];
  tool_choice?: 'auto' | 'none' | { type: 'function'; function: { name: string } };

  // RANA-specific features
  optimize?: 'cost' | 'speed' | 'quality' | 'balanced';
  cache?: boolean;
  fallback?: LLMProvider[];
  /** Mark as critical to bypass budget enforcement (requires allowCriticalBypass) */
  critical?: boolean;

  // Streaming
  stream?: boolean;

  // Metadata
  user?: string;
  metadata?: Record<string, any>;
}

export interface RanaChatResponse {
  // Response content
  id: string;
  provider: LLMProvider;
  model: string;
  content: string;
  role: MessageRole;

  // Tool calls (if any)
  tool_calls?: ToolCall[];

  // Usage & cost
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  cost: {
    prompt_cost: number;
    completion_cost: number;
    total_cost: number;
  };

  // Performance metrics
  latency_ms: number;
  cached: boolean;

  // Raw response
  raw: any;

  // Metadata
  created_at: Date;
  finish_reason: 'stop' | 'length' | 'tool_calls' | 'content_filter' | null;
}

export interface RanaStreamChunk {
  id: string;
  provider: LLMProvider;
  model: string;
  delta: string;
  done: boolean;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  cost?: {
    total_cost: number;
  };
}

// ============================================================================
// Configuration Types
// ============================================================================

export interface RanaConfig {
  // Provider API keys
  providers: {
    anthropic?: string;
    openai?: string;
    google?: string;
    xai?: string;
    mistral?: string;
    cohere?: string;
    together?: string;
    groq?: string;
    ollama?: string; // URL for local Ollama
  };

  // Default settings
  defaults?: {
    provider?: LLMProvider;
    model?: LLMModel;
    temperature?: number;
    max_tokens?: number;
    optimize?: 'cost' | 'speed' | 'quality' | 'balanced';
  };

  // Caching
  cache?: {
    enabled: boolean;
    ttl?: number; // seconds
    provider?: 'redis' | 'memory';
    redis?: {
      url?: string;
      host?: string;
      port?: number;
      password?: string;
    };
  };

  // Cost tracking
  cost_tracking?: {
    enabled: boolean;
    log_to_console?: boolean;
    save_to_db?: boolean;
    /** Budget enforcement configuration */
    budget?: BudgetConfig;
  };

  // Rate limiting
  rate_limit?: {
    enabled: boolean;
    max_requests_per_minute?: number;
  };

  // Logging
  logging?: {
    level: 'debug' | 'info' | 'warn' | 'error';
    enabled: boolean;
  };
}

// ============================================================================
// Cost & Budget Types
// ============================================================================

export type BudgetPeriod = 'hourly' | 'daily' | 'weekly' | 'monthly' | 'total';

export type BudgetAction = 'block' | 'warn' | 'log';

export interface BudgetConfig {
  /** Maximum amount to spend per period */
  limit: number;
  /** Time period for budget reset */
  period: BudgetPeriod;
  /** What to do when budget is exceeded */
  action: BudgetAction;
  /** Percentage at which to start warning (e.g., 80 = 80%) */
  warningThreshold?: number;
  /** Callback when budget warning is triggered */
  onWarning?: (spent: number, limit: number, percent: number) => void;
  /** Callback when budget is exceeded */
  onExceeded?: (spent: number, limit: number) => void;
  /** Allow critical requests to bypass budget (for emergency overrides) */
  allowCriticalBypass?: boolean;
}

export interface CostBreakdown {
  provider: LLMProvider;
  model: string;
  requests: number;
  total_tokens: number;
  total_cost: number;
  percentage: number;
}

export interface CostStats {
  total_spent: number;
  total_saved: number;
  savings_percentage: number;
  total_requests: number;
  total_tokens: number;
  cache_hit_rate: number;
  breakdown: CostBreakdown[];
  period: {
    start: Date;
    end: Date;
  };
}

// ============================================================================
// Error Types
// ============================================================================

export class RanaError extends Error {
  constructor(
    message: string,
    public code: string,
    public provider?: LLMProvider,
    public statusCode?: number,
    public details?: any
  ) {
    super(message);
    this.name = 'RanaError';
  }
}

export class RanaAuthError extends RanaError {
  constructor(provider: LLMProvider, details?: any) {
    super(
      `Authentication failed for ${provider}. Check your API key.`,
      'AUTH_ERROR',
      provider,
      401,
      details
    );
    this.name = 'RanaAuthError';
  }
}

export class RanaRateLimitError extends RanaError {
  constructor(provider: LLMProvider, details?: any) {
    super(
      `Rate limit exceeded for ${provider}. Please wait or upgrade your plan.`,
      'RATE_LIMIT_ERROR',
      provider,
      429,
      details
    );
    this.name = 'RanaRateLimitError';
  }
}

export class RanaNetworkError extends RanaError {
  constructor(provider: LLMProvider, details?: any) {
    super(
      `Network error when connecting to ${provider}. Check your connection.`,
      'NETWORK_ERROR',
      provider,
      undefined,
      details
    );
    this.name = 'RanaNetworkError';
  }
}

export class RanaBudgetExceededError extends RanaError {
  constructor(
    public currentSpent: number,
    public budgetLimit: number,
    public budgetPeriod: BudgetPeriod,
    details?: any
  ) {
    super(
      `Budget exceeded: $${currentSpent.toFixed(4)} spent (limit: $${budgetLimit.toFixed(2)} per ${budgetPeriod}). ` +
        `API calls are blocked. Reset budget or increase limit with rana config:set --budget`,
      'BUDGET_EXCEEDED',
      undefined,
      402,
      details
    );
    this.name = 'RanaBudgetExceededError';
  }
}

export class RanaBudgetWarningError extends RanaError {
  constructor(
    public currentSpent: number,
    public budgetLimit: number,
    public percentUsed: number,
    details?: any
  ) {
    super(
      `Budget warning: ${percentUsed.toFixed(1)}% used ($${currentSpent.toFixed(4)} of $${budgetLimit.toFixed(2)}).`,
      'BUDGET_WARNING',
      undefined,
      undefined,
      details
    );
    this.name = 'RanaBudgetWarningError';
  }
}

// ============================================================================
// Plugin Types
// ============================================================================

export interface RanaPlugin {
  name: string;
  version?: string;

  // Lifecycle hooks
  onInit?: (config: RanaConfig) => void | Promise<void>;
  onBeforeRequest?: (request: RanaChatRequest) => RanaChatRequest | Promise<RanaChatRequest>;
  onAfterResponse?: (response: RanaChatResponse) => RanaChatResponse | Promise<RanaChatResponse>;
  onError?: (error: RanaError) => void | Promise<void>;
  onDestroy?: () => void | Promise<void>;
}

// ============================================================================
// Database Types
// ============================================================================

export interface RanaDBConfig {
  provider: 'supabase' | 'prisma' | 'postgres';
  url: string;
  apiKey?: string;
}

export interface RanaDBQuery<T = any> {
  table(name: string): RanaDBQuery<T>;
  select(columns: string | string[]): RanaDBQuery<T>;
  insert(data: any): RanaDBQuery<T>;
  update(data: any): RanaDBQuery<T>;
  delete(): RanaDBQuery<T>;
  where(conditions: Record<string, any>): RanaDBQuery<T>;
  orderBy(column: string, direction?: 'asc' | 'desc'): RanaDBQuery<T>;
  limit(count: number): RanaDBQuery<T>;
  single(): Promise<T | null>;
  execute(): Promise<T[]>;
}

// ============================================================================
// Security Types
// ============================================================================

export interface RanaSecurityConfig {
  rateLimit?: {
    enabled: boolean;
    max: number;
    window: string;
  };
  owasp?: boolean;
  gdpr?: boolean;
  auth?: {
    provider: 'supabase' | 'nextauth' | 'clerk';
    sessionTTL?: number;
  };
}
