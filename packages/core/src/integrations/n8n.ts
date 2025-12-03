/**
 * n8n Integration for RANA
 *
 * Enables integration with n8n workflow automation platform.
 * Supports both self-hosted and n8n cloud instances.
 *
 * Features:
 * - Webhook triggers for RANA events
 * - Custom n8n nodes for RANA operations
 * - Workflow execution from RANA
 * - Credential management
 *
 * @example
 * ```typescript
 * import { N8nIntegration } from '@rana/core';
 *
 * const n8n = new N8nIntegration({
 *   baseUrl: 'https://your-n8n-instance.com',
 *   apiKey: process.env.N8N_API_KEY,
 * });
 *
 * // Trigger a workflow
 * await n8n.triggerWorkflow('my-workflow-id', {
 *   data: { message: 'Hello from RANA!' }
 * });
 *
 * // Listen for n8n webhooks
 * n8n.onWebhook('rana-trigger', async (data) => {
 *   const response = await rana.chat({ messages: data.messages });
 *   return { response: response.content };
 * });
 * ```
 */

import { EventEmitter } from 'events';

export interface N8nConfig {
  /** Base URL of your n8n instance */
  baseUrl: string;
  /** API key for authentication */
  apiKey: string;
  /** Optional: Webhook secret for verification */
  webhookSecret?: string;
  /** Optional: Default timeout in ms (default: 30000) */
  timeout?: number;
  /** Optional: Retry configuration */
  retry?: {
    maxRetries: number;
    retryDelay: number;
  };
}

export interface N8nWorkflow {
  id: string;
  name: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  nodes: N8nNode[];
  connections: Record<string, any>;
  settings?: Record<string, any>;
  tags?: string[];
}

export interface N8nNode {
  id: string;
  name: string;
  type: string;
  position: [number, number];
  parameters: Record<string, any>;
  credentials?: Record<string, any>;
}

export interface N8nExecution {
  id: string;
  workflowId: string;
  finished: boolean;
  mode: 'manual' | 'trigger' | 'webhook';
  startedAt: string;
  stoppedAt?: string;
  status: 'running' | 'success' | 'error' | 'waiting';
  data?: {
    resultData?: {
      runData?: Record<string, any>;
      error?: any;
    };
  };
}

export interface WebhookHandler {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  handler: (data: any, headers: Record<string, string>) => Promise<any>;
}

export interface TriggerWorkflowOptions {
  /** Data to pass to the workflow */
  data?: Record<string, any>;
  /** Wait for workflow to complete */
  waitForCompletion?: boolean;
  /** Timeout for waiting (ms) */
  timeout?: number;
}

export interface N8nCredential {
  id: string;
  name: string;
  type: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * n8n Integration Client
 *
 * Provides full integration with n8n workflow automation platform.
 */
export class N8nIntegration extends EventEmitter {
  private config: Required<N8nConfig>;
  private webhookHandlers: Map<string, WebhookHandler> = new Map();

  constructor(config: N8nConfig) {
    super();
    this.config = {
      baseUrl: config.baseUrl.replace(/\/$/, ''),
      apiKey: config.apiKey,
      webhookSecret: config.webhookSecret || '',
      timeout: config.timeout || 30000,
      retry: config.retry || { maxRetries: 3, retryDelay: 1000 },
    };
  }

  /**
   * Make authenticated request to n8n API
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.config.baseUrl}/api/v1${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'X-N8N-API-KEY': this.config.apiKey,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`n8n API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  // ============================================================================
  // WORKFLOW MANAGEMENT
  // ============================================================================

  /**
   * List all workflows
   */
  async listWorkflows(options?: {
    active?: boolean;
    tags?: string[];
    limit?: number;
    cursor?: string;
  }): Promise<{ data: N8nWorkflow[]; nextCursor?: string }> {
    const params = new URLSearchParams();
    if (options?.active !== undefined) params.set('active', String(options.active));
    if (options?.limit) params.set('limit', String(options.limit));
    if (options?.cursor) params.set('cursor', options.cursor);
    if (options?.tags) params.set('tags', options.tags.join(','));

    return this.request(`/workflows?${params}`);
  }

  /**
   * Get a specific workflow by ID
   */
  async getWorkflow(workflowId: string): Promise<N8nWorkflow> {
    return this.request(`/workflows/${workflowId}`);
  }

  /**
   * Create a new workflow
   */
  async createWorkflow(workflow: Partial<N8nWorkflow>): Promise<N8nWorkflow> {
    return this.request('/workflows', {
      method: 'POST',
      body: JSON.stringify(workflow),
    });
  }

  /**
   * Update an existing workflow
   */
  async updateWorkflow(
    workflowId: string,
    updates: Partial<N8nWorkflow>
  ): Promise<N8nWorkflow> {
    return this.request(`/workflows/${workflowId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  /**
   * Delete a workflow
   */
  async deleteWorkflow(workflowId: string): Promise<void> {
    await this.request(`/workflows/${workflowId}`, { method: 'DELETE' });
  }

  /**
   * Activate a workflow
   */
  async activateWorkflow(workflowId: string): Promise<N8nWorkflow> {
    return this.request(`/workflows/${workflowId}/activate`, { method: 'POST' });
  }

  /**
   * Deactivate a workflow
   */
  async deactivateWorkflow(workflowId: string): Promise<N8nWorkflow> {
    return this.request(`/workflows/${workflowId}/deactivate`, { method: 'POST' });
  }

  // ============================================================================
  // WORKFLOW EXECUTION
  // ============================================================================

  /**
   * Trigger a workflow execution
   */
  async triggerWorkflow(
    workflowId: string,
    options: TriggerWorkflowOptions = {}
  ): Promise<N8nExecution> {
    const execution = await this.request<N8nExecution>(
      `/workflows/${workflowId}/execute`,
      {
        method: 'POST',
        body: JSON.stringify({ data: options.data || {} }),
      }
    );

    if (options.waitForCompletion) {
      return this.waitForExecution(execution.id, options.timeout);
    }

    return execution;
  }

  /**
   * Execute workflow via webhook URL
   */
  async triggerWebhook(
    webhookPath: string,
    data: Record<string, any>,
    options?: { method?: 'GET' | 'POST'; headers?: Record<string, string> }
  ): Promise<any> {
    const url = `${this.config.baseUrl}/webhook/${webhookPath}`;
    const method = options?.method || 'POST';

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      body: method !== 'GET' ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      throw new Error(`Webhook error: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Wait for execution to complete
   */
  async waitForExecution(
    executionId: string,
    timeout: number = 30000
  ): Promise<N8nExecution> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const execution = await this.getExecution(executionId);

      if (execution.finished) {
        return execution;
      }

      await new Promise(resolve => setTimeout(resolve, 500));
    }

    throw new Error(`Execution timeout after ${timeout}ms`);
  }

  /**
   * Get execution details
   */
  async getExecution(executionId: string): Promise<N8nExecution> {
    return this.request(`/executions/${executionId}`);
  }

  /**
   * List executions
   */
  async listExecutions(options?: {
    workflowId?: string;
    status?: 'success' | 'error' | 'waiting';
    limit?: number;
    cursor?: string;
  }): Promise<{ data: N8nExecution[]; nextCursor?: string }> {
    const params = new URLSearchParams();
    if (options?.workflowId) params.set('workflowId', options.workflowId);
    if (options?.status) params.set('status', options.status);
    if (options?.limit) params.set('limit', String(options.limit));
    if (options?.cursor) params.set('cursor', options.cursor);

    return this.request(`/executions?${params}`);
  }

  /**
   * Stop a running execution
   */
  async stopExecution(executionId: string): Promise<N8nExecution> {
    return this.request(`/executions/${executionId}/stop`, { method: 'POST' });
  }

  /**
   * Delete an execution
   */
  async deleteExecution(executionId: string): Promise<void> {
    await this.request(`/executions/${executionId}`, { method: 'DELETE' });
  }

  // ============================================================================
  // CREDENTIALS
  // ============================================================================

  /**
   * List all credentials
   */
  async listCredentials(): Promise<{ data: N8nCredential[] }> {
    return this.request('/credentials');
  }

  /**
   * Create RANA credentials in n8n
   */
  async createRanaCredentials(options: {
    name: string;
    apiKey: string;
    baseUrl?: string;
  }): Promise<N8nCredential> {
    return this.request('/credentials', {
      method: 'POST',
      body: JSON.stringify({
        name: options.name,
        type: 'ranaApi',
        data: {
          apiKey: options.apiKey,
          baseUrl: options.baseUrl || 'https://api.rana.dev',
        },
      }),
    });
  }

  // ============================================================================
  // WEBHOOK HANDLERS (for n8n to call RANA)
  // ============================================================================

  /**
   * Register a webhook handler for n8n to call
   */
  onWebhook(
    path: string,
    handler: (data: any, headers: Record<string, string>) => Promise<any>,
    options?: { method?: 'GET' | 'POST' | 'PUT' | 'DELETE' }
  ): void {
    this.webhookHandlers.set(path, {
      path,
      method: options?.method || 'POST',
      handler,
    });

    this.emit('webhook:registered', { path, method: options?.method || 'POST' });
  }

  /**
   * Handle incoming webhook request
   */
  async handleWebhook(
    path: string,
    data: any,
    headers: Record<string, string>
  ): Promise<any> {
    const handler = this.webhookHandlers.get(path);

    if (!handler) {
      throw new Error(`No handler registered for path: ${path}`);
    }

    // Verify webhook secret if configured
    if (this.config.webhookSecret) {
      const signature = headers['x-n8n-signature'] || headers['x-webhook-signature'];
      if (!this.verifySignature(data, signature)) {
        throw new Error('Invalid webhook signature');
      }
    }

    return handler.handler(data, headers);
  }

  /**
   * Verify webhook signature
   */
  private verifySignature(data: any, signature: string): boolean {
    if (!this.config.webhookSecret || !signature) return false;

    // Use crypto for HMAC verification
    const crypto = require('crypto');
    const hmac = crypto.createHmac('sha256', this.config.webhookSecret);
    const expectedSignature = hmac.update(JSON.stringify(data)).digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  /**
   * Get Express/Fastify compatible middleware
   */
  getMiddleware() {
    return async (req: any, res: any, next?: () => void) => {
      const path = req.path.replace('/webhook/', '').replace('/n8n/', '');

      try {
        const result = await this.handleWebhook(path, req.body, req.headers);
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

  // ============================================================================
  // RANA-SPECIFIC NODES (Templates for n8n custom nodes)
  // ============================================================================

  /**
   * Get RANA node definitions for n8n
   * These can be used to create custom n8n nodes
   */
  getRanaNodeDefinitions(): Record<string, any>[] {
    return [
      {
        displayName: 'RANA Chat',
        name: 'ranaChat',
        group: ['transform'],
        version: 1,
        description: 'Send messages to RANA AI',
        defaults: { name: 'RANA Chat' },
        inputs: ['main'],
        outputs: ['main'],
        credentials: [{ name: 'ranaApi', required: true }],
        properties: [
          {
            displayName: 'Message',
            name: 'message',
            type: 'string',
            default: '',
            required: true,
            description: 'The message to send to RANA',
          },
          {
            displayName: 'Model',
            name: 'model',
            type: 'options',
            options: [
              { name: 'GPT-4o', value: 'gpt-4o' },
              { name: 'Claude 3.5 Sonnet', value: 'claude-3-5-sonnet' },
              { name: 'Gemini 1.5 Pro', value: 'gemini-1.5-pro' },
            ],
            default: 'gpt-4o',
          },
          {
            displayName: 'System Prompt',
            name: 'systemPrompt',
            type: 'string',
            typeOptions: { rows: 4 },
            default: '',
          },
        ],
      },
      {
        displayName: 'RANA Summarize',
        name: 'ranaSummarize',
        group: ['transform'],
        version: 1,
        description: 'Summarize text using RANA',
        defaults: { name: 'RANA Summarize' },
        inputs: ['main'],
        outputs: ['main'],
        credentials: [{ name: 'ranaApi', required: true }],
        properties: [
          {
            displayName: 'Text',
            name: 'text',
            type: 'string',
            typeOptions: { rows: 4 },
            default: '',
            required: true,
          },
          {
            displayName: 'Style',
            name: 'style',
            type: 'options',
            options: [
              { name: 'Brief', value: 'brief' },
              { name: 'Detailed', value: 'detailed' },
              { name: 'Bullet Points', value: 'bullets' },
            ],
            default: 'brief',
          },
        ],
      },
      {
        displayName: 'RANA Classify',
        name: 'ranaClassify',
        group: ['transform'],
        version: 1,
        description: 'Classify text into categories',
        defaults: { name: 'RANA Classify' },
        inputs: ['main'],
        outputs: ['main'],
        credentials: [{ name: 'ranaApi', required: true }],
        properties: [
          {
            displayName: 'Text',
            name: 'text',
            type: 'string',
            default: '',
            required: true,
          },
          {
            displayName: 'Categories',
            name: 'categories',
            type: 'string',
            default: '',
            required: true,
            description: 'Comma-separated list of categories',
          },
        ],
      },
      {
        displayName: 'RANA RAG Query',
        name: 'ranaRagQuery',
        group: ['transform'],
        version: 1,
        description: 'Query documents using RAG',
        defaults: { name: 'RANA RAG Query' },
        inputs: ['main'],
        outputs: ['main'],
        credentials: [{ name: 'ranaApi', required: true }],
        properties: [
          {
            displayName: 'Question',
            name: 'question',
            type: 'string',
            default: '',
            required: true,
          },
          {
            displayName: 'Collection',
            name: 'collection',
            type: 'string',
            default: 'default',
          },
          {
            displayName: 'Include Citations',
            name: 'includeCitations',
            type: 'boolean',
            default: true,
          },
        ],
      },
      {
        displayName: 'RANA Agent',
        name: 'ranaAgent',
        group: ['transform'],
        version: 1,
        description: 'Run a RANA agent with tools',
        defaults: { name: 'RANA Agent' },
        inputs: ['main'],
        outputs: ['main'],
        credentials: [{ name: 'ranaApi', required: true }],
        properties: [
          {
            displayName: 'Agent ID',
            name: 'agentId',
            type: 'string',
            default: '',
            required: true,
          },
          {
            displayName: 'Input',
            name: 'input',
            type: 'string',
            typeOptions: { rows: 4 },
            default: '',
            required: true,
          },
          {
            displayName: 'Tools',
            name: 'tools',
            type: 'multiOptions',
            options: [
              { name: 'Web Search', value: 'web_search' },
              { name: 'Calculator', value: 'calculator' },
              { name: 'Code Executor', value: 'code_executor' },
              { name: 'File Reader', value: 'file_reader' },
            ],
            default: [],
          },
        ],
      },
    ];
  }

  /**
   * Export workflow template for RANA integration
   */
  exportRanaWorkflowTemplate(options: {
    name: string;
    description?: string;
    triggers?: ('webhook' | 'schedule' | 'manual')[];
  }): N8nWorkflow {
    const nodes: N8nNode[] = [];
    let nodeId = 1;
    let yPosition = 300;

    // Add trigger nodes
    if (options.triggers?.includes('webhook')) {
      nodes.push({
        id: String(nodeId++),
        name: 'Webhook',
        type: 'n8n-nodes-base.webhook',
        position: [250, yPosition],
        parameters: {
          path: `rana-${options.name.toLowerCase().replace(/\s+/g, '-')}`,
          httpMethod: 'POST',
        },
      });
      yPosition += 150;
    }

    if (options.triggers?.includes('schedule')) {
      nodes.push({
        id: String(nodeId++),
        name: 'Schedule',
        type: 'n8n-nodes-base.scheduleTrigger',
        position: [250, yPosition],
        parameters: {
          rule: { interval: [{ field: 'hours', value: 1 }] },
        },
      });
      yPosition += 150;
    }

    // Add RANA node
    nodes.push({
      id: String(nodeId++),
      name: 'RANA AI',
      type: 'n8n-nodes-rana.ranaChat',
      position: [500, 300],
      parameters: {
        message: '={{ $json.message }}',
        model: 'gpt-4o',
      },
      credentials: { ranaApi: { id: 'rana-credentials', name: 'RANA API' } },
    });

    return {
      id: '',
      name: options.name,
      active: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      nodes,
      connections: {},
      settings: { executionOrder: 'v1' },
      tags: ['rana', 'ai'],
    };
  }
}

/**
 * Create n8n integration instance
 */
export function createN8nIntegration(config: N8nConfig): N8nIntegration {
  return new N8nIntegration(config);
}

export default N8nIntegration;
