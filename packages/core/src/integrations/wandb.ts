/**
 * @rana/integrations/wandb
 * Weights & Biases tracking integration
 *
 * Features:
 * - Experiment tracking for AI/LLM workflows
 * - Prompt versioning and comparison
 * - Cost and token usage tracking
 * - Model performance monitoring
 * - Automatic metric logging
 *
 * @example
 * ```typescript
 * import { createWandbTracker } from '@rana/core';
 *
 * const tracker = createWandbTracker({
 *   apiKey: process.env.WANDB_API_KEY,
 *   project: 'my-ai-project',
 * });
 *
 * // Start an experiment run
 * const run = await tracker.startRun({
 *   name: 'gpt-4-experiment',
 *   config: { model: 'gpt-4', temperature: 0.7 },
 * });
 *
 * // Log metrics
 * await run.log({
 *   accuracy: 0.95,
 *   latency_ms: 234,
 *   tokens: 150,
 *   cost: 0.003,
 * });
 *
 * // End run
 * await run.finish();
 * ```
 */

// ============================================================================
// Types
// ============================================================================

export interface WandbConfig {
  /** W&B API key */
  apiKey: string;
  /** Project name */
  project: string;
  /** Entity (username or team) */
  entity?: string;
  /** Base URL (for self-hosted) */
  baseUrl?: string;
  /** Default tags for all runs */
  defaultTags?: string[];
  /** Auto-log RANA metrics */
  autoLog?: boolean;
}

export interface RunConfig {
  /** Run name */
  name?: string;
  /** Run ID (for resuming) */
  id?: string;
  /** Configuration parameters */
  config?: Record<string, unknown>;
  /** Tags */
  tags?: string[];
  /** Notes */
  notes?: string;
  /** Group name */
  group?: string;
  /** Job type */
  jobType?: string;
  /** Resume mode */
  resume?: 'allow' | 'must' | 'never' | 'auto';
}

export interface LogData {
  [key: string]: number | string | boolean | number[] | LogData;
}

export interface PromptVersion {
  /** Prompt template */
  template: string;
  /** Variables in the prompt */
  variables?: Record<string, string>;
  /** Prompt name */
  name?: string;
  /** Prompt description */
  description?: string;
  /** Version tags */
  tags?: string[];
}

export interface TableData {
  columns: string[];
  data: Array<Array<string | number | boolean>>;
}

export interface ImageData {
  /** Base64 encoded image or URL */
  data: string;
  /** Image caption */
  caption?: string;
  /** Image mode (rgb, rgba, L) */
  mode?: 'rgb' | 'rgba' | 'L';
}

export interface RunSummary {
  id: string;
  name: string;
  state: 'running' | 'finished' | 'crashed' | 'failed';
  config: Record<string, unknown>;
  summary: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  url: string;
}

export interface Artifact {
  id: string;
  name: string;
  type: string;
  version: string;
  size: number;
  createdAt: Date;
}

// ============================================================================
// W&B Run
// ============================================================================

export class WandbRun {
  private tracker: WandbTracker;
  private runId: string;
  private runName: string;
  private step = 0;
  private config: Record<string, unknown>;
  private summaryData: Record<string, unknown> = {};
  private isFinished = false;

  constructor(
    tracker: WandbTracker,
    runId: string,
    runName: string,
    config: Record<string, unknown>
  ) {
    this.tracker = tracker;
    this.runId = runId;
    this.runName = runName;
    this.config = config;
  }

  get id(): string {
    return this.runId;
  }

  get name(): string {
    return this.runName;
  }

  get url(): string {
    return this.tracker.getRunUrl(this.runId);
  }

  /**
   * Log metrics for current step
   */
  async log(data: LogData, options?: { step?: number; commit?: boolean }): Promise<void> {
    if (this.isFinished) {
      throw new WandbError('Cannot log to finished run');
    }

    const step = options?.step ?? this.step++;

    await this.tracker.logMetrics(this.runId, {
      ...data,
      _step: step,
    });
  }

  /**
   * Log LLM-specific metrics
   */
  async logLLM(data: {
    model: string;
    prompt?: string;
    completion?: string;
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
    latencyMs?: number;
    cost?: number;
    success?: boolean;
    error?: string;
  }): Promise<void> {
    const metrics: LogData = {
      'llm/model': data.model,
      'llm/prompt_tokens': data.promptTokens || 0,
      'llm/completion_tokens': data.completionTokens || 0,
      'llm/total_tokens': data.totalTokens || 0,
      'llm/latency_ms': data.latencyMs || 0,
      'llm/cost': data.cost || 0,
      'llm/success': data.success ?? true,
    };

    if (data.error) {
      metrics['llm/error'] = data.error;
    }

    await this.log(metrics);

    // Log prompt/completion as table if provided
    if (data.prompt || data.completion) {
      await this.logTable('llm_traces', {
        columns: ['step', 'model', 'prompt', 'completion', 'tokens', 'cost'],
        data: [
          [
            this.step - 1,
            data.model,
            data.prompt || '',
            data.completion || '',
            data.totalTokens || 0,
            data.cost || 0,
          ],
        ],
      });
    }
  }

  /**
   * Log a prompt version
   */
  async logPrompt(prompt: PromptVersion): Promise<void> {
    await this.tracker.logPrompt(this.runId, prompt);
  }

  /**
   * Log a table
   */
  async logTable(name: string, table: TableData): Promise<void> {
    await this.tracker.logTable(this.runId, name, table);
  }

  /**
   * Log an image
   */
  async logImage(name: string, image: ImageData): Promise<void> {
    await this.tracker.logImage(this.runId, name, image);
  }

  /**
   * Log a histogram
   */
  async logHistogram(name: string, values: number[]): Promise<void> {
    await this.log({
      [name]: values,
    });
  }

  /**
   * Update run configuration
   */
  async updateConfig(config: Record<string, unknown>): Promise<void> {
    this.config = { ...this.config, ...config };
    await this.tracker.updateRunConfig(this.runId, config);
  }

  /**
   * Set summary metrics (displayed on run overview)
   */
  async summary(data: Record<string, unknown>): Promise<void> {
    this.summaryData = { ...this.summaryData, ...data };
    await this.tracker.updateRunSummary(this.runId, data);
  }

  /**
   * Add tags to run
   */
  async addTags(tags: string[]): Promise<void> {
    await this.tracker.addRunTags(this.runId, tags);
  }

  /**
   * Log artifact
   */
  async logArtifact(
    name: string,
    type: string,
    data: Record<string, unknown> | string,
    options?: { description?: string; metadata?: Record<string, unknown> }
  ): Promise<Artifact> {
    return this.tracker.logArtifact(this.runId, name, type, data, options);
  }

  /**
   * Mark run as finished
   */
  async finish(options?: { exitCode?: number }): Promise<void> {
    if (this.isFinished) return;

    await this.tracker.finishRun(this.runId, {
      exitCode: options?.exitCode ?? 0,
      summary: this.summaryData,
    });

    this.isFinished = true;
  }

  /**
   * Mark run as crashed
   */
  async crash(error: Error): Promise<void> {
    await this.summary({
      error: error.message,
      error_type: error.name,
    });

    await this.tracker.finishRun(this.runId, {
      exitCode: 1,
      state: 'crashed',
    });

    this.isFinished = true;
  }
}

// ============================================================================
// W&B Tracker
// ============================================================================

export class WandbTracker {
  private config: Required<WandbConfig>;
  private runs: Map<string, WandbRun> = new Map();

  constructor(config: WandbConfig) {
    this.config = {
      apiKey: config.apiKey,
      project: config.project,
      entity: config.entity || '',
      baseUrl: config.baseUrl || 'https://api.wandb.ai',
      defaultTags: config.defaultTags || [],
      autoLog: config.autoLog ?? true,
    };
  }

  /**
   * Start a new run
   */
  async startRun(options: RunConfig = {}): Promise<WandbRun> {
    const runId = options.id || this.generateRunId();
    const runName = options.name || `run-${Date.now()}`;

    const payload = {
      name: runName,
      id: runId,
      config: options.config || {},
      tags: [...this.config.defaultTags, ...(options.tags || [])],
      notes: options.notes,
      group: options.group,
      job_type: options.jobType,
      project: this.config.project,
      entity: this.config.entity,
    };

    await this.request('/runs', {
      method: 'POST',
      body: payload,
    });

    const run = new WandbRun(this, runId, runName, options.config || {});
    this.runs.set(runId, run);

    return run;
  }

  /**
   * Resume an existing run
   */
  async resumeRun(runId: string): Promise<WandbRun> {
    const runData = await this.request<{
      name: string;
      config: Record<string, unknown>;
    }>(`/runs/${runId}`);

    const run = new WandbRun(this, runId, runData.name, runData.config);
    this.runs.set(runId, run);

    return run;
  }

  /**
   * Get run by ID
   */
  getRun(runId: string): WandbRun | undefined {
    return this.runs.get(runId);
  }

  /**
   * List runs
   */
  async listRuns(options?: {
    state?: 'running' | 'finished' | 'crashed';
    tags?: string[];
    limit?: number;
  }): Promise<RunSummary[]> {
    const params = new URLSearchParams();
    if (options?.state) params.set('state', options.state);
    if (options?.tags?.length) params.set('tags', options.tags.join(','));
    if (options?.limit) params.set('limit', String(options.limit));

    const response = await this.request<{
      runs: Array<{
        id: string;
        name: string;
        state: string;
        config: Record<string, unknown>;
        summary: Record<string, unknown>;
        created_at: string;
        updated_at: string;
      }>;
    }>(`/runs?${params}`);

    return response.runs.map((r) => ({
      id: r.id,
      name: r.name,
      state: r.state as RunSummary['state'],
      config: r.config,
      summary: r.summary,
      createdAt: new Date(r.created_at),
      updatedAt: new Date(r.updated_at),
      url: this.getRunUrl(r.id),
    }));
  }

  /**
   * Get run URL
   */
  getRunUrl(runId: string): string {
    const base = this.config.baseUrl.replace('api.', 'app.');
    return `${base}/${this.config.entity}/${this.config.project}/runs/${runId}`;
  }

  // --------------------------------------------------------------------------
  // Internal Methods (called by WandbRun)
  // --------------------------------------------------------------------------

  async logMetrics(runId: string, data: LogData): Promise<void> {
    await this.request(`/runs/${runId}/log`, {
      method: 'POST',
      body: { data },
    });
  }

  async logPrompt(runId: string, prompt: PromptVersion): Promise<void> {
    await this.request(`/runs/${runId}/prompts`, {
      method: 'POST',
      body: prompt,
    });
  }

  async logTable(runId: string, name: string, table: TableData): Promise<void> {
    await this.request(`/runs/${runId}/tables`, {
      method: 'POST',
      body: { name, ...table },
    });
  }

  async logImage(runId: string, name: string, image: ImageData): Promise<void> {
    await this.request(`/runs/${runId}/media`, {
      method: 'POST',
      body: { name, type: 'image', ...image },
    });
  }

  async updateRunConfig(runId: string, config: Record<string, unknown>): Promise<void> {
    await this.request(`/runs/${runId}/config`, {
      method: 'PATCH',
      body: { config },
    });
  }

  async updateRunSummary(runId: string, summary: Record<string, unknown>): Promise<void> {
    await this.request(`/runs/${runId}/summary`, {
      method: 'PATCH',
      body: { summary },
    });
  }

  async addRunTags(runId: string, tags: string[]): Promise<void> {
    await this.request(`/runs/${runId}/tags`, {
      method: 'POST',
      body: { tags },
    });
  }

  async logArtifact(
    runId: string,
    name: string,
    type: string,
    data: Record<string, unknown> | string,
    options?: { description?: string; metadata?: Record<string, unknown> }
  ): Promise<Artifact> {
    const response = await this.request<{
      id: string;
      version: string;
      size: number;
      created_at: string;
    }>(`/runs/${runId}/artifacts`, {
      method: 'POST',
      body: {
        name,
        type,
        data: typeof data === 'string' ? data : JSON.stringify(data),
        ...options,
      },
    });

    return {
      id: response.id,
      name,
      type,
      version: response.version,
      size: response.size,
      createdAt: new Date(response.created_at),
    };
  }

  async finishRun(
    runId: string,
    options: {
      exitCode?: number;
      state?: 'finished' | 'crashed' | 'failed';
      summary?: Record<string, unknown>;
    }
  ): Promise<void> {
    await this.request(`/runs/${runId}/finish`, {
      method: 'POST',
      body: {
        exit_code: options.exitCode ?? 0,
        state: options.state || 'finished',
        summary: options.summary,
      },
    });

    this.runs.delete(runId);
  }

  // --------------------------------------------------------------------------
  // Helpers
  // --------------------------------------------------------------------------

  private async request<T>(
    endpoint: string,
    options?: { method?: string; body?: unknown }
  ): Promise<T> {
    const url = `${this.config.baseUrl}/v1/${this.config.entity}/${this.config.project}${endpoint}`;

    const response = await fetch(url, {
      method: options?.method || 'GET',
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: options?.body ? JSON.stringify(options.body) : undefined,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new WandbError(`W&B API error: ${error}`, response.status);
    }

    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      return response.json() as Promise<T>;
    }

    return {} as T;
  }

  private generateRunId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// ============================================================================
// RANA Integration Middleware
// ============================================================================

export interface RanaWandbMiddleware {
  /** Called before each LLM request */
  beforeRequest: (request: {
    model: string;
    messages: unknown[];
    config?: Record<string, unknown>;
  }) => Promise<void>;

  /** Called after each LLM response */
  afterResponse: (response: {
    model: string;
    content: string;
    usage: { promptTokens: number; completionTokens: number; totalTokens: number };
    latencyMs: number;
    cost: number;
  }) => Promise<void>;

  /** Called on error */
  onError: (error: Error, request: unknown) => Promise<void>;

  /** Get the current run */
  getRun: () => WandbRun | undefined;

  /** Finish tracking */
  finish: () => Promise<void>;
}

/**
 * Create middleware for automatic RANA tracking
 */
export async function createRanaWandbMiddleware(
  config: WandbConfig & { runConfig?: RunConfig }
): Promise<RanaWandbMiddleware> {
  const tracker = new WandbTracker(config);
  const run = await tracker.startRun({
    ...config.runConfig,
    tags: ['rana', ...(config.runConfig?.tags || [])],
  });

  let requestCount = 0;
  let totalTokens = 0;
  let totalCost = 0;

  return {
    beforeRequest: async (request) => {
      await run.log({
        'request/model': request.model,
        'request/message_count': Array.isArray(request.messages) ? request.messages.length : 0,
      });
    },

    afterResponse: async (response) => {
      requestCount++;
      totalTokens += response.usage.totalTokens;
      totalCost += response.cost;

      await run.logLLM({
        model: response.model,
        completion: response.content,
        promptTokens: response.usage.promptTokens,
        completionTokens: response.usage.completionTokens,
        totalTokens: response.usage.totalTokens,
        latencyMs: response.latencyMs,
        cost: response.cost,
        success: true,
      });

      // Update running summary
      await run.summary({
        'total/requests': requestCount,
        'total/tokens': totalTokens,
        'total/cost': totalCost,
        'avg/latency_ms': response.latencyMs,
      });
    },

    onError: async (error, request) => {
      await run.log({
        'error/message': error.message,
        'error/type': error.name,
      });
    },

    getRun: () => run,

    finish: async () => {
      await run.summary({
        'final/requests': requestCount,
        'final/tokens': totalTokens,
        'final/cost': totalCost,
      });
      await run.finish();
    },
  };
}

// ============================================================================
// Errors
// ============================================================================

export class WandbError extends Error {
  constructor(
    message: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'WandbError';
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create W&B tracker
 */
export function createWandbTracker(config: WandbConfig): WandbTracker {
  return new WandbTracker(config);
}

/**
 * Create experiment context
 */
export async function withExperiment<T>(
  config: WandbConfig & { runConfig?: RunConfig },
  fn: (run: WandbRun) => Promise<T>
): Promise<T> {
  const tracker = createWandbTracker(config);
  const run = await tracker.startRun(config.runConfig);

  try {
    const result = await fn(run);
    await run.finish();
    return result;
  } catch (error) {
    await run.crash(error as Error);
    throw error;
  }
}
