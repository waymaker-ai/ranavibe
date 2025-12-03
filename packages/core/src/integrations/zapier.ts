/**
 * Zapier Integration for RANA
 *
 * Enables integration with Zapier automation platform.
 * Provides triggers, actions, and searches for RANA operations.
 *
 * @example
 * ```typescript
 * import { ZapierIntegration } from '@rana/core';
 *
 * const zapier = new ZapierIntegration({
 *   clientId: process.env.ZAPIER_CLIENT_ID,
 *   clientSecret: process.env.ZAPIER_CLIENT_SECRET,
 * });
 *
 * // Handle Zapier trigger
 * zapier.onTrigger('new_chat_response', async (input) => {
 *   return { message: 'Response from RANA' };
 * });
 *
 * // Handle Zapier action
 * zapier.onAction('send_message', async (input) => {
 *   const response = await rana.chat({ messages: input.messages });
 *   return { response: response.content };
 * });
 * ```
 */

import { EventEmitter } from 'events';

export interface ZapierConfig {
  /** OAuth Client ID */
  clientId: string;
  /** OAuth Client Secret */
  clientSecret: string;
  /** Redirect URI for OAuth */
  redirectUri?: string;
  /** Base URL for Zapier API */
  baseUrl?: string;
  /** Webhook signing secret */
  webhookSecret?: string;
}

export interface ZapierTrigger {
  key: string;
  noun: string;
  display: {
    label: string;
    description: string;
    hidden?: boolean;
    important?: boolean;
  };
  operation: {
    type: 'polling' | 'hook';
    perform: (z: ZapierContext, bundle: ZapierBundle) => Promise<any[]>;
    performList?: (z: ZapierContext, bundle: ZapierBundle) => Promise<any[]>;
    performSubscribe?: (z: ZapierContext, bundle: ZapierBundle) => Promise<any>;
    performUnsubscribe?: (z: ZapierContext, bundle: ZapierBundle) => Promise<any>;
    sample?: Record<string, any>;
    inputFields?: ZapierField[];
    outputFields?: ZapierField[];
  };
}

export interface ZapierAction {
  key: string;
  noun: string;
  display: {
    label: string;
    description: string;
    hidden?: boolean;
    important?: boolean;
  };
  operation: {
    perform: (z: ZapierContext, bundle: ZapierBundle) => Promise<any>;
    sample?: Record<string, any>;
    inputFields?: ZapierField[];
    outputFields?: ZapierField[];
  };
}

export interface ZapierSearch {
  key: string;
  noun: string;
  display: {
    label: string;
    description: string;
  };
  operation: {
    perform: (z: ZapierContext, bundle: ZapierBundle) => Promise<any[]>;
    inputFields?: ZapierField[];
    outputFields?: ZapierField[];
  };
}

export interface ZapierField {
  key: string;
  label: string;
  type: 'string' | 'text' | 'integer' | 'number' | 'boolean' | 'datetime' | 'file' | 'password' | 'copy';
  required?: boolean;
  helpText?: string;
  default?: any;
  choices?: { label: string; value: string }[] | string[];
  list?: boolean;
  children?: ZapierField[];
  dynamic?: string;
  search?: string;
  altersDynamicFields?: boolean;
}

export interface ZapierContext {
  request: (options: any) => Promise<any>;
  console: { log: (...args: any[]) => void };
  errors: {
    Error: new (message: string) => Error;
    HaltedError: new (message: string) => Error;
    ExpiredAuthError: new (message: string) => Error;
    RefreshAuthError: new (message: string) => Error;
  };
  JSON: typeof JSON;
  hash: (algorithm: string, data: string) => string;
  dehydrate: (func: Function, data: any) => string;
  dehydrateFile: (func: Function, data: any) => string;
  stashFile: (promise: Promise<any>) => Promise<string>;
  cursor: {
    get: () => Promise<string | null>;
    set: (cursor: string) => Promise<void>;
  };
}

export interface ZapierBundle {
  authData: Record<string, any>;
  inputData: Record<string, any>;
  inputDataRaw: Record<string, any>;
  meta: {
    isLoadingSample: boolean;
    isFillingDynamicDropdown: boolean;
    isPopulatingDedupe: boolean;
    isTestingAuth: boolean;
    limit: number;
    page: number;
    zap?: { id: string };
  };
  rawRequest?: {
    method: string;
    querystring: string;
    headers: Record<string, string>;
    content: string;
  };
  cleanedRequest?: Record<string, any>;
  subscribeData?: Record<string, any>;
  targetUrl?: string;
}

export interface ZapierWebhookPayload {
  id: string;
  zapId: string;
  hookId: string;
  event: string;
  data: Record<string, any>;
  timestamp: string;
}

type TriggerHandler = (input: Record<string, any>, meta: ZapierBundle['meta']) => Promise<any[]>;
type ActionHandler = (input: Record<string, any>, meta: ZapierBundle['meta']) => Promise<any>;
type SearchHandler = (input: Record<string, any>, meta: ZapierBundle['meta']) => Promise<any[]>;

/**
 * Zapier Integration Client
 */
export class ZapierIntegration extends EventEmitter {
  private config: Required<ZapierConfig>;
  private triggers: Map<string, TriggerHandler> = new Map();
  private actions: Map<string, ActionHandler> = new Map();
  private searches: Map<string, SearchHandler> = new Map();
  private webhookSubscriptions: Map<string, Set<string>> = new Map();

  constructor(config: ZapierConfig) {
    super();
    this.config = {
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      redirectUri: config.redirectUri || 'https://zapier.com/dashboard/auth/oauth/return/App123CLIAPI/',
      baseUrl: config.baseUrl || 'https://nla.zapier.com/api/v1',
      webhookSecret: config.webhookSecret || '',
    };
  }

  // ============================================================================
  // TRIGGER REGISTRATION
  // ============================================================================

  /**
   * Register a trigger handler
   */
  onTrigger(key: string, handler: TriggerHandler): void {
    this.triggers.set(key, handler);
    this.emit('trigger:registered', { key });
  }

  /**
   * Execute a trigger
   */
  async executeTrigger(key: string, bundle: ZapierBundle): Promise<any[]> {
    const handler = this.triggers.get(key);
    if (!handler) {
      throw new Error(`Trigger not found: ${key}`);
    }
    return handler(bundle.inputData, bundle.meta);
  }

  // ============================================================================
  // ACTION REGISTRATION
  // ============================================================================

  /**
   * Register an action handler
   */
  onAction(key: string, handler: ActionHandler): void {
    this.actions.set(key, handler);
    this.emit('action:registered', { key });
  }

  /**
   * Execute an action
   */
  async executeAction(key: string, bundle: ZapierBundle): Promise<any> {
    const handler = this.actions.get(key);
    if (!handler) {
      throw new Error(`Action not found: ${key}`);
    }
    return handler(bundle.inputData, bundle.meta);
  }

  // ============================================================================
  // SEARCH REGISTRATION
  // ============================================================================

  /**
   * Register a search handler
   */
  onSearch(key: string, handler: SearchHandler): void {
    this.searches.set(key, handler);
    this.emit('search:registered', { key });
  }

  /**
   * Execute a search
   */
  async executeSearch(key: string, bundle: ZapierBundle): Promise<any[]> {
    const handler = this.searches.get(key);
    if (!handler) {
      throw new Error(`Search not found: ${key}`);
    }
    return handler(bundle.inputData, bundle.meta);
  }

  // ============================================================================
  // WEBHOOK HANDLING
  // ============================================================================

  /**
   * Subscribe to webhook
   */
  async subscribeWebhook(
    triggerKey: string,
    targetUrl: string,
    subscribeData?: Record<string, any>
  ): Promise<{ id: string }> {
    const subscriptionId = `${triggerKey}_${Date.now()}`;

    if (!this.webhookSubscriptions.has(triggerKey)) {
      this.webhookSubscriptions.set(triggerKey, new Set());
    }
    this.webhookSubscriptions.get(triggerKey)!.add(targetUrl);

    this.emit('webhook:subscribed', { triggerKey, targetUrl, subscriptionId });

    return { id: subscriptionId };
  }

  /**
   * Unsubscribe from webhook
   */
  async unsubscribeWebhook(
    triggerKey: string,
    targetUrl: string
  ): Promise<void> {
    const subscriptions = this.webhookSubscriptions.get(triggerKey);
    if (subscriptions) {
      subscriptions.delete(targetUrl);
    }

    this.emit('webhook:unsubscribed', { triggerKey, targetUrl });
  }

  /**
   * Send data to all subscribed webhooks
   */
  async sendToWebhooks(triggerKey: string, data: any[]): Promise<void> {
    const subscriptions = this.webhookSubscriptions.get(triggerKey);
    if (!subscriptions || subscriptions.size === 0) return;

    const promises = Array.from(subscriptions).map(async (targetUrl) => {
      try {
        await fetch(targetUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
      } catch (error) {
        this.emit('webhook:error', { triggerKey, targetUrl, error });
      }
    });

    await Promise.all(promises);
  }

  /**
   * Handle incoming webhook from Zapier
   */
  async handleWebhook(
    payload: ZapierWebhookPayload,
    signature?: string
  ): Promise<any> {
    // Verify signature if configured
    if (this.config.webhookSecret && signature) {
      if (!this.verifySignature(payload, signature)) {
        throw new Error('Invalid webhook signature');
      }
    }

    this.emit('webhook:received', payload);

    // Route to appropriate handler
    if (payload.event.startsWith('trigger:')) {
      const triggerKey = payload.event.replace('trigger:', '');
      return this.executeTrigger(triggerKey, {
        authData: {},
        inputData: payload.data,
        inputDataRaw: payload.data,
        meta: {
          isLoadingSample: false,
          isFillingDynamicDropdown: false,
          isPopulatingDedupe: false,
          isTestingAuth: false,
          limit: 100,
          page: 0,
        },
      });
    }

    if (payload.event.startsWith('action:')) {
      const actionKey = payload.event.replace('action:', '');
      return this.executeAction(actionKey, {
        authData: {},
        inputData: payload.data,
        inputDataRaw: payload.data,
        meta: {
          isLoadingSample: false,
          isFillingDynamicDropdown: false,
          isPopulatingDedupe: false,
          isTestingAuth: false,
          limit: 100,
          page: 0,
        },
      });
    }

    return { received: true };
  }

  /**
   * Verify webhook signature
   */
  private verifySignature(payload: any, signature: string): boolean {
    if (!this.config.webhookSecret) return true;

    const crypto = require('crypto');
    const hmac = crypto.createHmac('sha256', this.config.webhookSecret);
    const expectedSignature = hmac.update(JSON.stringify(payload)).digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  // ============================================================================
  // ZAPIER APP DEFINITION
  // ============================================================================

  /**
   * Get complete Zapier app definition
   */
  getAppDefinition(): Record<string, any> {
    return {
      version: '2.0.0', // RANA version
      platformVersion: '15.0.0', // Zapier platform version

      authentication: this.getAuthenticationConfig(),
      triggers: this.getTriggerDefinitions(),
      actions: this.getActionDefinitions(),
      searches: this.getSearchDefinitions(),

      beforeRequest: [(request: any, z: ZapierContext, bundle: ZapierBundle) => {
        request.headers['Authorization'] = `Bearer ${bundle.authData.access_token}`;
        request.headers['X-Rana-Source'] = 'zapier';
        return request;
      }],

      afterResponse: [(response: any) => {
        if (response.status === 401) {
          throw new Error('Authentication required');
        }
        return response;
      }],
    };
  }

  /**
   * Get authentication configuration
   */
  private getAuthenticationConfig(): Record<string, any> {
    return {
      type: 'oauth2',
      oauth2Config: {
        authorizeUrl: {
          url: 'https://api.rana.dev/oauth/authorize',
          params: {
            client_id: '{{process.env.CLIENT_ID}}',
            redirect_uri: '{{bundle.inputData.redirect_uri}}',
            response_type: 'code',
            scope: 'chat:read chat:write rag:read rag:write agent:execute',
          },
        },
        getAccessToken: {
          url: 'https://api.rana.dev/oauth/token',
          method: 'POST',
          body: {
            code: '{{bundle.inputData.code}}',
            client_id: '{{process.env.CLIENT_ID}}',
            client_secret: '{{process.env.CLIENT_SECRET}}',
            redirect_uri: '{{bundle.inputData.redirect_uri}}',
            grant_type: 'authorization_code',
          },
        },
        refreshAccessToken: {
          url: 'https://api.rana.dev/oauth/token',
          method: 'POST',
          body: {
            refresh_token: '{{bundle.authData.refresh_token}}',
            client_id: '{{process.env.CLIENT_ID}}',
            client_secret: '{{process.env.CLIENT_SECRET}}',
            grant_type: 'refresh_token',
          },
        },
        autoRefresh: true,
      },
      test: {
        url: 'https://api.rana.dev/v1/me',
      },
      connectionLabel: '{{bundle.inputData.email}}',
    };
  }

  /**
   * Get trigger definitions
   */
  private getTriggerDefinitions(): Record<string, ZapierTrigger> {
    return {
      new_chat_response: {
        key: 'new_chat_response',
        noun: 'Chat Response',
        display: {
          label: 'New Chat Response',
          description: 'Triggers when a new chat response is generated.',
          important: true,
        },
        operation: {
          type: 'hook',
          perform: async (z, bundle) => {
            return this.executeTrigger('new_chat_response', bundle);
          },
          performSubscribe: async (z, bundle) => {
            const result = await this.subscribeWebhook(
              'new_chat_response',
              bundle.targetUrl!
            );
            return result;
          },
          performUnsubscribe: async (z, bundle) => {
            await this.unsubscribeWebhook(
              'new_chat_response',
              bundle.subscribeData?.targetUrl
            );
          },
          sample: {
            id: 'resp_123',
            content: 'Hello! How can I help you today?',
            model: 'gpt-4o',
            created_at: '2024-01-15T10:30:00Z',
          },
          inputFields: [
            {
              key: 'model',
              label: 'Model',
              type: 'string',
              choices: ['gpt-4o', 'claude-3-5-sonnet', 'gemini-1.5-pro'],
              helpText: 'Filter by specific model',
            },
          ],
          outputFields: [
            { key: 'id', label: 'Response ID', type: 'string' },
            { key: 'content', label: 'Response Content', type: 'text' },
            { key: 'model', label: 'Model Used', type: 'string' },
            { key: 'created_at', label: 'Created At', type: 'datetime' },
          ],
        },
      },

      new_rag_document: {
        key: 'new_rag_document',
        noun: 'RAG Document',
        display: {
          label: 'New Document Indexed',
          description: 'Triggers when a new document is indexed for RAG.',
        },
        operation: {
          type: 'hook',
          perform: async (z, bundle) => {
            return this.executeTrigger('new_rag_document', bundle);
          },
          performSubscribe: async (z, bundle) => {
            return this.subscribeWebhook('new_rag_document', bundle.targetUrl!);
          },
          performUnsubscribe: async (z, bundle) => {
            await this.unsubscribeWebhook('new_rag_document', bundle.subscribeData?.targetUrl);
          },
          sample: {
            id: 'doc_123',
            title: 'Product Documentation',
            source: 'https://docs.example.com/product',
            chunks: 15,
            indexed_at: '2024-01-15T10:30:00Z',
          },
        },
      },

      agent_completed: {
        key: 'agent_completed',
        noun: 'Agent Run',
        display: {
          label: 'Agent Run Completed',
          description: 'Triggers when an agent completes a task.',
        },
        operation: {
          type: 'hook',
          perform: async (z, bundle) => {
            return this.executeTrigger('agent_completed', bundle);
          },
          performSubscribe: async (z, bundle) => {
            return this.subscribeWebhook('agent_completed', bundle.targetUrl!);
          },
          performUnsubscribe: async (z, bundle) => {
            await this.unsubscribeWebhook('agent_completed', bundle.subscribeData?.targetUrl);
          },
          sample: {
            id: 'run_123',
            agent_id: 'agent_abc',
            status: 'completed',
            result: { summary: 'Task completed successfully' },
            duration_ms: 5432,
          },
        },
      },
    };
  }

  /**
   * Get action definitions
   */
  private getActionDefinitions(): Record<string, ZapierAction> {
    return {
      send_message: {
        key: 'send_message',
        noun: 'Message',
        display: {
          label: 'Send Chat Message',
          description: 'Send a message to RANA AI and get a response.',
          important: true,
        },
        operation: {
          perform: async (z, bundle) => {
            return this.executeAction('send_message', bundle);
          },
          inputFields: [
            {
              key: 'message',
              label: 'Message',
              type: 'text',
              required: true,
              helpText: 'The message to send to the AI',
            },
            {
              key: 'model',
              label: 'Model',
              type: 'string',
              choices: [
                { label: 'GPT-4o (Best)', value: 'gpt-4o' },
                { label: 'GPT-4o Mini (Fast)', value: 'gpt-4o-mini' },
                { label: 'Claude 3.5 Sonnet', value: 'claude-3-5-sonnet' },
                { label: 'Claude 3.5 Haiku (Fast)', value: 'claude-3-5-haiku' },
                { label: 'Gemini 1.5 Pro', value: 'gemini-1.5-pro' },
              ],
              default: 'gpt-4o',
            },
            {
              key: 'system_prompt',
              label: 'System Prompt',
              type: 'text',
              helpText: 'Optional instructions for the AI',
            },
            {
              key: 'temperature',
              label: 'Temperature',
              type: 'number',
              default: '0.7',
              helpText: '0 = deterministic, 1 = creative',
            },
          ],
          outputFields: [
            { key: 'response', label: 'AI Response', type: 'text' },
            { key: 'model', label: 'Model Used', type: 'string' },
            { key: 'tokens_used', label: 'Tokens Used', type: 'integer' },
            { key: 'cost', label: 'Cost (USD)', type: 'number' },
          ],
          sample: {
            response: 'I can help you with that!',
            model: 'gpt-4o',
            tokens_used: 150,
            cost: 0.0045,
          },
        },
      },

      summarize_text: {
        key: 'summarize_text',
        noun: 'Summary',
        display: {
          label: 'Summarize Text',
          description: 'Generate a summary of the provided text.',
        },
        operation: {
          perform: async (z, bundle) => {
            return this.executeAction('summarize_text', bundle);
          },
          inputFields: [
            {
              key: 'text',
              label: 'Text to Summarize',
              type: 'text',
              required: true,
            },
            {
              key: 'style',
              label: 'Summary Style',
              type: 'string',
              choices: [
                { label: 'Brief (1-2 sentences)', value: 'brief' },
                { label: 'Detailed (paragraph)', value: 'detailed' },
                { label: 'Bullet Points', value: 'bullets' },
                { label: 'Executive Summary', value: 'executive' },
              ],
              default: 'brief',
            },
            {
              key: 'max_length',
              label: 'Max Words',
              type: 'integer',
              helpText: 'Maximum number of words in summary',
            },
          ],
          sample: {
            summary: 'This document discusses...',
            word_count: 25,
            original_length: 1500,
          },
        },
      },

      classify_text: {
        key: 'classify_text',
        noun: 'Classification',
        display: {
          label: 'Classify Text',
          description: 'Classify text into one of the provided categories.',
        },
        operation: {
          perform: async (z, bundle) => {
            return this.executeAction('classify_text', bundle);
          },
          inputFields: [
            {
              key: 'text',
              label: 'Text to Classify',
              type: 'text',
              required: true,
            },
            {
              key: 'categories',
              label: 'Categories',
              type: 'string',
              required: true,
              helpText: 'Comma-separated list of categories',
            },
          ],
          sample: {
            category: 'support',
            confidence: 0.95,
            all_scores: { support: 0.95, sales: 0.03, general: 0.02 },
          },
        },
      },

      query_rag: {
        key: 'query_rag',
        noun: 'RAG Query',
        display: {
          label: 'Query Documents (RAG)',
          description: 'Query your indexed documents using AI.',
        },
        operation: {
          perform: async (z, bundle) => {
            return this.executeAction('query_rag', bundle);
          },
          inputFields: [
            {
              key: 'question',
              label: 'Question',
              type: 'text',
              required: true,
            },
            {
              key: 'collection',
              label: 'Collection',
              type: 'string',
              default: 'default',
            },
            {
              key: 'top_k',
              label: 'Number of Sources',
              type: 'integer',
              default: '5',
            },
          ],
          sample: {
            answer: 'Based on the documents...',
            sources: ['doc_1', 'doc_2'],
            confidence: 0.89,
          },
        },
      },

      run_agent: {
        key: 'run_agent',
        noun: 'Agent',
        display: {
          label: 'Run AI Agent',
          description: 'Execute an AI agent with tools to complete a task.',
        },
        operation: {
          perform: async (z, bundle) => {
            return this.executeAction('run_agent', bundle);
          },
          inputFields: [
            {
              key: 'agent_id',
              label: 'Agent ID',
              type: 'string',
              required: true,
              dynamic: 'list_agents.id.name',
            },
            {
              key: 'input',
              label: 'Task Input',
              type: 'text',
              required: true,
            },
            {
              key: 'max_steps',
              label: 'Max Steps',
              type: 'integer',
              default: '10',
            },
          ],
          sample: {
            result: 'Task completed',
            steps_taken: 3,
            tools_used: ['web_search', 'calculator'],
          },
        },
      },
    };
  }

  /**
   * Get search definitions
   */
  private getSearchDefinitions(): Record<string, ZapierSearch> {
    return {
      find_document: {
        key: 'find_document',
        noun: 'Document',
        display: {
          label: 'Find Document',
          description: 'Search for a document in your RAG collection.',
        },
        operation: {
          perform: async (z, bundle) => {
            return this.executeSearch('find_document', bundle);
          },
          inputFields: [
            {
              key: 'query',
              label: 'Search Query',
              type: 'string',
              required: true,
            },
            {
              key: 'collection',
              label: 'Collection',
              type: 'string',
            },
          ],
        },
      },

      list_agents: {
        key: 'list_agents',
        noun: 'Agent',
        display: {
          label: 'List Agents',
          description: 'Get a list of available AI agents.',
        },
        operation: {
          perform: async (z, bundle) => {
            return this.executeSearch('list_agents', bundle);
          },
          inputFields: [],
        },
      },
    };
  }

  /**
   * Get Express/Fastify compatible middleware
   */
  getMiddleware() {
    return async (req: any, res: any, next?: () => void) => {
      try {
        const signature = req.headers['x-zapier-signature'];
        const result = await this.handleWebhook(req.body, signature);
        res.json(result);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    };
  }
}

/**
 * Create Zapier integration instance
 */
export function createZapierIntegration(config: ZapierConfig): ZapierIntegration {
  return new ZapierIntegration(config);
}

export default ZapierIntegration;
