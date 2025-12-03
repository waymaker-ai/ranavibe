/**
 * Make (Integromat) Integration for RANA
 *
 * Enables integration with Make.com automation platform.
 * Provides modules, webhooks, and connections for RANA operations.
 *
 * @example
 * ```typescript
 * import { MakeIntegration } from '@rana/core';
 *
 * const make = new MakeIntegration({
 *   apiKey: process.env.MAKE_API_KEY,
 *   teamId: process.env.MAKE_TEAM_ID,
 * });
 *
 * // Create a webhook for Make to call
 * const webhook = await make.createWebhook({
 *   name: 'RANA Chat',
 *   handler: async (data) => {
 *     const response = await rana.chat({ messages: data.messages });
 *     return { response: response.content };
 *   }
 * });
 *
 * // Trigger a Make scenario
 * await make.triggerScenario('scenario-id', { data: 'payload' });
 * ```
 */

import { EventEmitter } from 'events';

export interface MakeConfig {
  /** Make API Key */
  apiKey: string;
  /** Team/Organization ID */
  teamId: string;
  /** API Region (us, eu) */
  region?: 'us' | 'eu';
  /** Webhook base URL for your server */
  webhookBaseUrl?: string;
  /** Webhook signing secret */
  webhookSecret?: string;
}

export interface MakeScenario {
  id: string;
  name: string;
  teamId: string;
  folderId?: string;
  description?: string;
  isEnabled: boolean;
  isPaused: boolean;
  createdAt: string;
  updatedAt: string;
  scheduling?: {
    type: 'immediately' | 'interval' | 'cron';
    interval?: number;
    cron?: string;
  };
  blueprint?: MakeBlueprint;
}

export interface MakeBlueprint {
  name: string;
  flow: MakeModule[];
  metadata?: {
    version: number;
    designer?: Record<string, any>;
  };
}

export interface MakeModule {
  id: number;
  module: string;
  version: number;
  parameters: Record<string, any>;
  mapper?: Record<string, any>;
  metadata?: {
    designer?: { x: number; y: number };
    expect?: any[];
  };
  routes?: MakeRoute[];
}

export interface MakeRoute {
  flow: MakeModule[];
  label?: string;
  filter?: {
    name: string;
    conditions: any[][];
  };
}

export interface MakeWebhook {
  id: string;
  name: string;
  url: string;
  type: 'web' | 'mailhook' | 'custom';
  enabled: boolean;
  teamId: string;
  createdAt: string;
  queueCount?: number;
}

export interface MakeExecution {
  id: string;
  scenarioId: string;
  status: 'running' | 'success' | 'warning' | 'error';
  startedAt: string;
  finishedAt?: string;
  operations: number;
  transfer: number;
  duration?: number;
}

export interface MakeConnection {
  id: string;
  name: string;
  accountName: string;
  accountType: string;
  teamId: string;
  scopes?: string[];
  metadata?: Record<string, any>;
}

export interface WebhookHandlerConfig {
  name: string;
  description?: string;
  handler: (data: any, headers: Record<string, string>) => Promise<any>;
  dataStructure?: MakeDataStructure[];
}

export interface MakeDataStructure {
  name: string;
  type: 'text' | 'number' | 'boolean' | 'date' | 'array' | 'collection';
  label?: string;
  required?: boolean;
  default?: any;
  spec?: MakeDataStructure[]; // For array/collection types
}

type WebhookHandler = (data: any, headers: Record<string, string>) => Promise<any>;

/**
 * Make (Integromat) Integration Client
 */
export class MakeIntegration extends EventEmitter {
  private config: Required<MakeConfig>;
  private webhookHandlers: Map<string, { handler: WebhookHandler; config: WebhookHandlerConfig }> = new Map();
  private baseUrl: string;

  constructor(config: MakeConfig) {
    super();
    this.config = {
      apiKey: config.apiKey,
      teamId: config.teamId,
      region: config.region || 'us',
      webhookBaseUrl: config.webhookBaseUrl || '',
      webhookSecret: config.webhookSecret || '',
    };

    this.baseUrl = config.region === 'eu'
      ? 'https://eu1.make.com/api/v2'
      : 'https://us1.make.com/api/v2';
  }

  /**
   * Make authenticated request to Make API
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${this.config.apiKey}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Make API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  // ============================================================================
  // SCENARIO MANAGEMENT
  // ============================================================================

  /**
   * List all scenarios
   */
  async listScenarios(options?: {
    folderId?: string;
    isEnabled?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<{ scenarios: MakeScenario[]; pg: { limit: number; offset: number; total: number } }> {
    const params = new URLSearchParams();
    params.set('teamId', this.config.teamId);
    if (options?.folderId) params.set('folderId', options.folderId);
    if (options?.isEnabled !== undefined) params.set('isEnabled', String(options.isEnabled));
    if (options?.limit) params.set('pg[limit]', String(options.limit));
    if (options?.offset) params.set('pg[offset]', String(options.offset));

    return this.request(`/scenarios?${params}`);
  }

  /**
   * Get a specific scenario
   */
  async getScenario(scenarioId: string): Promise<{ scenario: MakeScenario }> {
    return this.request(`/scenarios/${scenarioId}`);
  }

  /**
   * Create a new scenario
   */
  async createScenario(scenario: {
    name: string;
    teamId?: string;
    folderId?: string;
    blueprint?: MakeBlueprint;
    scheduling?: MakeScenario['scheduling'];
  }): Promise<{ scenario: MakeScenario }> {
    return this.request('/scenarios', {
      method: 'POST',
      body: JSON.stringify({
        ...scenario,
        teamId: scenario.teamId || this.config.teamId,
      }),
    });
  }

  /**
   * Update a scenario
   */
  async updateScenario(
    scenarioId: string,
    updates: Partial<MakeScenario>
  ): Promise<{ scenario: MakeScenario }> {
    return this.request(`/scenarios/${scenarioId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  /**
   * Delete a scenario
   */
  async deleteScenario(scenarioId: string): Promise<void> {
    await this.request(`/scenarios/${scenarioId}`, { method: 'DELETE' });
  }

  /**
   * Enable/activate a scenario
   */
  async enableScenario(scenarioId: string): Promise<{ scenario: MakeScenario }> {
    return this.request(`/scenarios/${scenarioId}/start`, { method: 'POST' });
  }

  /**
   * Disable/pause a scenario
   */
  async disableScenario(scenarioId: string): Promise<{ scenario: MakeScenario }> {
    return this.request(`/scenarios/${scenarioId}/stop`, { method: 'POST' });
  }

  /**
   * Trigger a scenario manually
   */
  async triggerScenario(
    scenarioId: string,
    data?: Record<string, any>
  ): Promise<{ execution: MakeExecution }> {
    return this.request(`/scenarios/${scenarioId}/run`, {
      method: 'POST',
      body: JSON.stringify({ data }),
    });
  }

  // ============================================================================
  // WEBHOOK MANAGEMENT
  // ============================================================================

  /**
   * List all webhooks
   */
  async listWebhooks(): Promise<{ hooks: MakeWebhook[] }> {
    return this.request(`/hooks?teamId=${this.config.teamId}`);
  }

  /**
   * Create a webhook in Make
   */
  async createMakeWebhook(options: {
    name: string;
    scenarioId?: string;
  }): Promise<{ hook: MakeWebhook }> {
    return this.request('/hooks', {
      method: 'POST',
      body: JSON.stringify({
        name: options.name,
        teamId: this.config.teamId,
        type: 'web',
        scenarioId: options.scenarioId,
      }),
    });
  }

  /**
   * Delete a webhook
   */
  async deleteMakeWebhook(webhookId: string): Promise<void> {
    await this.request(`/hooks/${webhookId}`, { method: 'DELETE' });
  }

  /**
   * Register a local webhook handler for Make to call
   */
  registerWebhook(id: string, config: WebhookHandlerConfig): string {
    this.webhookHandlers.set(id, { handler: config.handler, config });

    const webhookUrl = `${this.config.webhookBaseUrl}/make/webhook/${id}`;
    this.emit('webhook:registered', { id, url: webhookUrl });

    return webhookUrl;
  }

  /**
   * Handle incoming webhook from Make
   */
  async handleWebhook(
    webhookId: string,
    data: any,
    headers: Record<string, string>
  ): Promise<any> {
    const entry = this.webhookHandlers.get(webhookId);

    if (!entry) {
      throw new Error(`No handler registered for webhook: ${webhookId}`);
    }

    // Verify signature if configured
    if (this.config.webhookSecret) {
      const signature = headers['x-make-signature'] || headers['x-hook-signature'];
      if (!this.verifySignature(data, signature)) {
        throw new Error('Invalid webhook signature');
      }
    }

    this.emit('webhook:received', { webhookId, data });

    return entry.handler(data, headers);
  }

  /**
   * Verify webhook signature
   */
  private verifySignature(data: any, signature: string): boolean {
    if (!this.config.webhookSecret || !signature) return false;

    const crypto = require('crypto');
    const hmac = crypto.createHmac('sha256', this.config.webhookSecret);
    const expectedSignature = hmac.update(JSON.stringify(data)).digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  // ============================================================================
  // EXECUTIONS
  // ============================================================================

  /**
   * List scenario executions
   */
  async listExecutions(
    scenarioId: string,
    options?: { limit?: number; offset?: number }
  ): Promise<{ executions: MakeExecution[]; pg: { limit: number; offset: number; total: number } }> {
    const params = new URLSearchParams();
    if (options?.limit) params.set('pg[limit]', String(options.limit));
    if (options?.offset) params.set('pg[offset]', String(options.offset));

    return this.request(`/scenarios/${scenarioId}/logs?${params}`);
  }

  /**
   * Get execution details
   */
  async getExecution(executionId: string): Promise<{ execution: MakeExecution }> {
    return this.request(`/executions/${executionId}`);
  }

  // ============================================================================
  // CONNECTIONS
  // ============================================================================

  /**
   * List all connections
   */
  async listConnections(): Promise<{ connections: MakeConnection[] }> {
    return this.request(`/connections?teamId=${this.config.teamId}`);
  }

  /**
   * Create a RANA connection
   */
  async createRanaConnection(options: {
    name: string;
    apiKey: string;
    baseUrl?: string;
  }): Promise<{ connection: MakeConnection }> {
    return this.request('/connections', {
      method: 'POST',
      body: JSON.stringify({
        name: options.name,
        accountType: 'rana',
        teamId: this.config.teamId,
        data: {
          apiKey: options.apiKey,
          baseUrl: options.baseUrl || 'https://api.rana.dev',
        },
      }),
    });
  }

  // ============================================================================
  // RANA MODULE DEFINITIONS (for Make App)
  // ============================================================================

  /**
   * Get RANA module definitions for Make
   */
  getRanaModuleDefinitions(): MakeModule[] {
    return [
      // Chat Module
      {
        id: 1,
        module: 'rana:chat',
        version: 1,
        parameters: {},
        metadata: {
          expect: [
            { name: 'message', type: 'text', label: 'Message', required: true },
            {
              name: 'model',
              type: 'select',
              label: 'Model',
              default: 'gpt-4o',
              options: [
                { label: 'GPT-4o', value: 'gpt-4o' },
                { label: 'GPT-4o Mini', value: 'gpt-4o-mini' },
                { label: 'Claude 3.5 Sonnet', value: 'claude-3-5-sonnet' },
                { label: 'Claude 3.5 Haiku', value: 'claude-3-5-haiku' },
                { label: 'Gemini 1.5 Pro', value: 'gemini-1.5-pro' },
              ],
            },
            { name: 'systemPrompt', type: 'text', label: 'System Prompt' },
            { name: 'temperature', type: 'number', label: 'Temperature', default: 0.7 },
          ],
        },
      },

      // Summarize Module
      {
        id: 2,
        module: 'rana:summarize',
        version: 1,
        parameters: {},
        metadata: {
          expect: [
            { name: 'text', type: 'text', label: 'Text to Summarize', required: true },
            {
              name: 'style',
              type: 'select',
              label: 'Style',
              default: 'brief',
              options: [
                { label: 'Brief', value: 'brief' },
                { label: 'Detailed', value: 'detailed' },
                { label: 'Bullet Points', value: 'bullets' },
              ],
            },
          ],
        },
      },

      // Classify Module
      {
        id: 3,
        module: 'rana:classify',
        version: 1,
        parameters: {},
        metadata: {
          expect: [
            { name: 'text', type: 'text', label: 'Text', required: true },
            { name: 'categories', type: 'text', label: 'Categories (comma-separated)', required: true },
          ],
        },
      },

      // RAG Query Module
      {
        id: 4,
        module: 'rana:ragQuery',
        version: 1,
        parameters: {},
        metadata: {
          expect: [
            { name: 'question', type: 'text', label: 'Question', required: true },
            { name: 'collection', type: 'text', label: 'Collection', default: 'default' },
            { name: 'topK', type: 'number', label: 'Number of Results', default: 5 },
          ],
        },
      },

      // Agent Module
      {
        id: 5,
        module: 'rana:agent',
        version: 1,
        parameters: {},
        metadata: {
          expect: [
            { name: 'agentId', type: 'text', label: 'Agent ID', required: true },
            { name: 'input', type: 'text', label: 'Task Input', required: true },
            { name: 'maxSteps', type: 'number', label: 'Max Steps', default: 10 },
          ],
        },
      },

      // Extract Module
      {
        id: 6,
        module: 'rana:extract',
        version: 1,
        parameters: {},
        metadata: {
          expect: [
            { name: 'text', type: 'text', label: 'Text', required: true },
            { name: 'schema', type: 'text', label: 'Schema (JSON)', required: true },
          ],
        },
      },

      // Translate Module
      {
        id: 7,
        module: 'rana:translate',
        version: 1,
        parameters: {},
        metadata: {
          expect: [
            { name: 'text', type: 'text', label: 'Text', required: true },
            {
              name: 'targetLanguage',
              type: 'select',
              label: 'Target Language',
              required: true,
              options: [
                { label: 'English', value: 'en' },
                { label: 'Spanish', value: 'es' },
                { label: 'French', value: 'fr' },
                { label: 'German', value: 'de' },
                { label: 'Japanese', value: 'ja' },
                { label: 'Chinese', value: 'zh' },
              ],
            },
          ],
        },
      },
    ];
  }

  /**
   * Export a scenario blueprint template for RANA integration
   */
  exportRanaScenarioTemplate(options: {
    name: string;
    trigger: 'webhook' | 'schedule' | 'instant';
    modules: ('chat' | 'summarize' | 'classify' | 'rag' | 'agent')[];
  }): MakeBlueprint {
    const flow: MakeModule[] = [];
    let moduleId = 1;

    // Add trigger
    if (options.trigger === 'webhook') {
      flow.push({
        id: moduleId++,
        module: 'gateway:CustomWebHook',
        version: 1,
        parameters: { hook: '', maxResults: 1 },
      });
    } else if (options.trigger === 'schedule') {
      flow.push({
        id: moduleId++,
        module: 'builtin:BasicScheduler',
        version: 1,
        parameters: { interval: 60 },
      });
    }

    // Add RANA modules
    for (const mod of options.modules) {
      const moduleDefinitions = this.getRanaModuleDefinitions();
      const definition = moduleDefinitions.find(m => m.module === `rana:${mod}`);
      if (definition) {
        flow.push({
          ...definition,
          id: moduleId++,
        });
      }
    }

    return {
      name: options.name,
      flow,
      metadata: {
        version: 1,
      },
    };
  }

  /**
   * Get Express/Fastify compatible middleware
   */
  getMiddleware() {
    return async (req: any, res: any, next?: () => void) => {
      const webhookId = req.path.replace('/make/webhook/', '').replace('/', '');

      try {
        const result = await this.handleWebhook(webhookId, req.body, req.headers);
        res.json(result);
      } catch (error: any) {
        if (error.message.includes('No handler')) {
          if (next) next();
          else res.status(404).json({ error: 'Webhook not found' });
        } else {
          res.status(500).json({ error: error.message });
        }
      }
    };
  }
}

/**
 * Create Make integration instance
 */
export function createMakeIntegration(config: MakeConfig): MakeIntegration {
  return new MakeIntegration(config);
}

export default MakeIntegration;
